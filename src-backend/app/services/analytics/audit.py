from sqlalchemy.orm import Session
from app.models.optimization_models import OptimizationAuditEntry, OptimizationJob, OptimizationExecutionHistory, MultiObjectiveDecisionResult
from typing import Dict, Any, List
from datetime import datetime, timezone
import csv
import io

class OptimizationAuditEngine:
    """
    Registers immutable audit logs for optimization jobs and supports filtered querying
    and CSV report exports for compliance audits.
    """

    def log_optimization_audit(self, job_id: str, db: Session) -> OptimizationAuditEntry:
        if not db:
            raise ValueError("No database session provided.")

        job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
        if not job:
            raise ValueError(f"Job ID {job_id} not found.")

        # Gather other outputs to log
        history = db.query(OptimizationExecutionHistory).filter(OptimizationExecutionHistory.job_id == job_id).first()
        decision = db.query(MultiObjectiveDecisionResult).filter(MultiObjectiveDecisionResult.job_id == job_id).first()

        config = job.config
        
        # Build audit entry
        audit = OptimizationAuditEntry(
            job_id=job_id,
            user_id=job.user_id,
            timestamp=datetime.now(timezone.utc),
            config_mode=config.mode if config else "BALANCED",
            objectives_json=config.objectives_json if config else None,
            constraints_json=config.constraints_json if config else None,
            strategy_selected=decision.ai_recommendation_json.get("selected_strategy", "Balanced") if decision and decision.ai_recommendation_json else "Balanced",
            alternative_strategies_json=decision.strategies_json if decision else None,
            ai_recommendation_json=decision.ai_recommendation_json if decision else None,
            confidence_score=decision.ai_recommendation_json.get("confidence_score", 0.85) if decision and decision.ai_recommendation_json else 0.85,
            execution_time_ms=history.execution_time_ms if history else 0.0,
            final_status=job.status,
            objective_score=history.objective_score if history else 0.0,
            warnings_json=[],
            errors_json=[job.error_message] if job.error_message else []
        )

        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

    def query_audit_logs(
        self,
        db: Session,
        status: str = None,
        strategy: str = None,
        from_date: str = None,
        to_date: str = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[OptimizationAuditEntry]:
        if not db:
            return []
            
        query = db.query(OptimizationAuditEntry)

        if status:
            query = query.filter(OptimizationAuditEntry.final_status == status)
        if strategy:
            query = query.filter(OptimizationAuditEntry.strategy_selected == strategy)
            
        if from_date:
            try:
                dt_from = datetime.fromisoformat(from_date)
                query = query.filter(OptimizationAuditEntry.timestamp >= dt_from)
            except ValueError:
                pass
        if to_date:
            try:
                dt_to = datetime.fromisoformat(to_date)
                query = query.filter(OptimizationAuditEntry.timestamp <= dt_to)
            except ValueError:
                pass

        return query.order_by(OptimizationAuditEntry.timestamp.desc()).limit(limit).offset(offset).all()

    def generate_audit_csv(self, db: Session) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Audit ID", "Job ID", "User ID", "Timestamp", "Config Mode", 
            "Selected Strategy", "Confidence Score", "Execution Time (ms)", 
            "Final Status", "Objective Score"
        ])
        
        if not db:
            return output.getvalue()

        logs = db.query(OptimizationAuditEntry).order_by(OptimizationAuditEntry.timestamp.desc()).all()
        
        for log in logs:
            writer.writerow([
                log.id, log.job_id, log.user_id, log.timestamp.isoformat(), 
                log.config_mode, log.strategy_selected, log.confidence_score, 
                log.execution_time_ms, log.final_status, log.objective_score
            ])
            
        return output.getvalue()
