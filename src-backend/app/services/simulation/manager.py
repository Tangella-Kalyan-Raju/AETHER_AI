import logging
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.simulation_models import SimulationRun, SimulationStateSnapshot, SimulationEventLog
from app.models.scenario_models import ScenarioTemplate, ScenarioEvent
from app.database.connection import SessionLocal

logger = logging.getLogger(__name__)

class SimulationManager:
    """
    Manages the lifecycle and isolated timeline loop for simulations.
    """
    def __init__(self):
        self.active_tasks = {}

    def start_simulation(self, simulation_id: str):
        if simulation_id in self.active_tasks:
            raise ValueError("Simulation is already running.")

        try:
            loop = asyncio.get_running_loop()
            task = loop.create_task(self._simulation_loop(simulation_id))
            self.active_tasks[simulation_id] = task
        except RuntimeError:
            # No running event loop (e.g. during sync unit tests) — skip background task
            logger.info(f"No event loop available; simulation {simulation_id} created but not auto-started.")

    def stop_simulation(self, simulation_id: str):
        if simulation_id in self.active_tasks:
            self.active_tasks[simulation_id].cancel()
            del self.active_tasks[simulation_id]

    async def _simulation_loop(self, simulation_id: str):
        logger.info(f"Starting simulation loop for {simulation_id}")
        db = SessionLocal()
        try:
            run = db.query(SimulationRun).filter(SimulationRun.id == simulation_id).first()
            if not run:
                return

            run.status = "RUNNING"
            run.started_at = datetime.now(timezone.utc)
            db.commit()
            
            scenario = db.query(ScenarioTemplate).filter(ScenarioTemplate.id == run.scenario_id).first()
            events = sorted(scenario.events, key=lambda e: e.start_offset_mins)

            # Very simple fast-forward execution logic for Phase 6.3 Proof of Concept
            # In a real environment, we would sleep according to speed_multiplier.
            # Here, we will just step through the events instantly if fast-forwarding, 
            # or sleep briefly to simulate timeline progression.
            
            current_time = 0
            max_time = scenario.estimated_duration_mins
            
            while current_time <= max_time:
                # Check for events at this timestamp
                current_events = [e for e in events if e.start_offset_mins == current_time]
                
                for event in current_events:
                    # Log the event hitting the timeline
                    log = SimulationEventLog(
                        simulation_id=run.id,
                        sim_time_offset_mins=current_time,
                        event_category="SCENARIO_EVENT",
                        message=f"Triggered {event.event_type} event: {event.parameters_json}"
                    )
                    db.add(log)
                    
                    # Here is where we would call the StateTransitionEngine
                    # state_engine.apply_event(event)

                # Snapshot the state
                snap = SimulationStateSnapshot(
                    simulation_id=run.id,
                    sim_time_offset_mins=current_time,
                    state_json={"status": "OK", "time": current_time, "active_events": len(current_events)}
                )
                db.add(snap)
                
                # Advance time
                current_time += 15 # 15 min ticks for efficiency in demo
                run.current_sim_time_offset_mins = current_time
                db.commit()
                
                # Artificial delay to mimic time passing, scaled by multiplier
                if run.speed_multiplier < 100:
                    await asyncio.sleep(1.0 / run.speed_multiplier)

            run.status = "COMPLETED"
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
            
        except asyncio.CancelledError:
            logger.info(f"Simulation {simulation_id} paused/stopped.")
            run = db.query(SimulationRun).filter(SimulationRun.id == simulation_id).first()
            if run:
                run.status = "PAUSED"
                db.commit()
        except Exception as e:
            logger.error(f"Simulation {simulation_id} failed: {e}")
            run = db.query(SimulationRun).filter(SimulationRun.id == simulation_id).first()
            if run:
                run.status = "FAILED"
                db.commit()
        finally:
            db.close()
            if simulation_id in self.active_tasks:
                del self.active_tasks[simulation_id]

simulation_manager = SimulationManager()
