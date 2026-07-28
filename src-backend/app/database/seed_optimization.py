import asyncio
import logging
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.optimization_models import OptimizationConfig, OptimizationJob
from app.services.optimization.scheduler import OptimizationJobScheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_optimization")

async def seed():
    db: Session = SessionLocal()
    try:
        # 1. Seed Optimization Configurations
        config_count = db.query(OptimizationConfig).count()
        if config_count == 0:
            logger.info("Seeding default Optimization Configurations...")
            configs = [
                OptimizationConfig(
                    name="Economic Grid Dispatch",
                    mode="ECONOMIC",
                    solver_settings_json={"max_iterations": 200, "tolerance": 0.001, "timeout_seconds": 60},
                    resource_limits_json={"cpu_cores": 4, "memory_mb": 2048},
                    constraints_json=["Frequency", "Voltage", "ThermalLimits", "CarbonCeiling", "BatterySOC"],
                    objectives_json=[
                        {"name": "CostMinimization", "weight": 0.8},
                        {"name": "CarbonReduction", "weight": 0.4},
                        {"name": "GridStability", "weight": 0.6}
                    ]
                ),
                OptimizationConfig(
                    name="Green Mode Optimization",
                    mode="GREEN",
                    solver_settings_json={"max_iterations": 300, "tolerance": 0.0001, "timeout_seconds": 90},
                    resource_limits_json={"cpu_cores": 6, "memory_mb": 4096},
                    constraints_json=["Frequency", "Voltage", "ThermalLimits", "BatterySOC"],
                    objectives_json=[
                        {"name": "CostMinimization", "weight": 0.2},
                        {"name": "CarbonReduction", "weight": 0.9},
                        {"name": "GridStability", "weight": 0.5}
                    ]
                ),
                OptimizationConfig(
                    name="Balanced Grid Dispatch",
                    mode="BALANCED",
                    solver_settings_json={"max_iterations": 250, "tolerance": 0.0005, "timeout_seconds": 75},
                    resource_limits_json={"cpu_cores": 4, "memory_mb": 3072},
                    constraints_json=["Frequency", "Voltage", "ThermalLimits", "CarbonCeiling", "BatterySOC"],
                    objectives_json=[
                        {"name": "CostMinimization", "weight": 0.5},
                        {"name": "CarbonReduction", "weight": 0.5},
                        {"name": "GridStability", "weight": 0.5}
                    ]
                )
            ]
            db.add_all(configs)
            db.commit()
            for c in configs:
                db.refresh(c)
            logger.info("Successfully seeded 3 configurations.")
        else:
            logger.info(f"Configurations already exist ({config_count}). Skipping config seed.")

        # 2. Seed a completed job to populate the history/queue and charts
        job_count = db.query(OptimizationJob).count()
        if job_count == 0:
            first_config = db.query(OptimizationConfig).first()
            if first_config:
                logger.info(f"Triggering default optimization job run for config: {first_config.name}")
                job = OptimizationJob(
                    config_id=first_config.id,
                    priority="HIGH",
                    status="PENDING",
                    progress=0.0
                )
                db.add(job)
                db.commit()
                db.refresh(job)

                scheduler = OptimizationJobScheduler()
                await scheduler.enqueue_job(job.id, db)

                logger.info("Waiting for the background optimization pipeline execution to finish...")
                # Pipeline runs through 13 stages; we wait up to 8 seconds for it to complete.
                for _ in range(16):
                    await asyncio.sleep(0.5)
                    db.refresh(job)
                    if job.status in ["COMPLETED", "FAILED"]:
                        logger.info(f"Optimization job finished with status: {job.status}")
                        break
        else:
            logger.info(f"Optimization jobs already exist ({job_count}). Skipping job execution.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding optimization data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed())
