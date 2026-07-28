import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.optimization_models import OptimizationJob, OptimizationExecutionHistory
from app.services.optimization.pipeline import OptimizationExecutionPipeline

logger = logging.getLogger("[GPO.OPTIMIZATION.SCHEDULER]")

class OptimizationJobScheduler:
    """
    Manages queueing, scheduling, status transitions, retries, and 
    background runtime executions of smart grid optimization pipelines.
    """

    def __init__(self):
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.pipeline = OptimizationExecutionPipeline()

    async def enqueue_job(self, job_id: str, db: Session) -> None:
        """
        Pushes a job into the execution queue and starts background worker execution.
        """
        job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found in database.")
            return

        job.status = "QUEUED"
        job.progress = 5.0
        db.commit()

        # Start async background process task
        task = asyncio.create_task(self._execute_job_task(job_id))
        self.active_tasks[job_id] = task
        logger.info(f"Job {job_id} enqueued for priority execution.")

    async def cancel_job(self, job_id: str, db: Session) -> bool:
        """
        Cancels a running job and cleans up associated threads.
        """
        job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
        if not job:
            return False

        if job.status in ["COMPLETED", "FAILED", "CANCELLED"]:
            return False

        # Terminate active task if running
        task = self.active_tasks.get(job_id)
        if task and not task.done():
            task.cancel()
            del self.active_tasks[job_id]

        job.status = "CANCELLED"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()

        logger.warn(f"Job {job_id} cancelled by administrative request.")
        return True

    async def _execute_job_task(self, job_id: str) -> None:
        """
        Background task runner that executes the 9-stage optimization pipeline.
        """
        from app.database.connection import SessionLocal
        db = SessionLocal()
        
        try:
            # 1. Update job to running state
            job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
            if not job:
                return

            job.status = "RUNNING"
            job.started_at = datetime.now(timezone.utc)
            job.progress = 10.0
            db.commit()

            # 2. Start execution pipeline (will mock iterations for foundation phase)
            # Pass progress callback to update progress column dynamically
            def progress_callback(pct: float):
                job.progress = pct
                db.commit()

            history_record = await self.pipeline.run(job, db, progress_callback)
            
            job.status = "COMPLETED"
            job.progress = 100.0
            job.completed_at = datetime.now(timezone.utc)
            db.commit()

            logger.info(f"Job {job_id} completed successfully. Objective Score: {history_record.objective_score}")

        except asyncio.CancelledError:
            logger.warn(f"Execution task for job {job_id} was cancelled.")
        except Exception as e:
            logger.error(f"Error running job {job_id}: {str(e)}", exc_info=True)
            job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
            if job:
                job.status = "FAILED"
                job.error_message = str(e)
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            if job_id in self.active_tasks:
                del self.active_tasks[job_id]
            db.close()
