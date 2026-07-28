from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import asyncio

from app.database.connection import get_db
from app.core.security import get_current_user
from app.models.simulation_models import SimulationRun, SimulationStateSnapshot, SimulationEventLog
from app.services.simulation.manager import simulation_manager

router = APIRouter()

class SimulationStartRequest(BaseModel):
    scenario_id: str
    speed_multiplier: float = 1.0

class SimulationResponse(BaseModel):
    id: str
    scenario_id: str
    status: str
    speed_multiplier: float
    current_sim_time_offset_mins: int

@router.get("/", response_model=List[SimulationResponse])
def list_simulations(db: Session = Depends(get_db)):
    return db.query(SimulationRun).order_by(SimulationRun.started_at.desc()).all()

@router.post("/start", response_model=SimulationResponse)
async def start_simulation(data: SimulationStartRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    run = SimulationRun(
        scenario_id=data.scenario_id,
        speed_multiplier=data.speed_multiplier,
        created_by=current_user.email
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    
    # Start the simulation loop in the background via asyncio task
    simulation_manager.start_simulation(run.id)
    
    return run

@router.post("/{simulation_id}/stop")
def stop_simulation(simulation_id: str, db: Session = Depends(get_db)):
    simulation_manager.stop_simulation(simulation_id)
    run = db.query(SimulationRun).filter(SimulationRun.id == simulation_id).first()
    if run:
        run.status = "COMPLETED"
        db.commit()
    return {"status": "stopped"}

@router.get("/{simulation_id}/state")
def get_simulation_state(simulation_id: str, db: Session = Depends(get_db)):
    run = db.query(SimulationRun).filter(SimulationRun.id == simulation_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation not found")
        
    last_snap = db.query(SimulationStateSnapshot)\
        .filter(SimulationStateSnapshot.simulation_id == simulation_id)\
        .order_by(SimulationStateSnapshot.sim_time_offset_mins.desc())\
        .first()
        
    logs = db.query(SimulationEventLog)\
        .filter(SimulationEventLog.simulation_id == simulation_id)\
        .order_by(SimulationEventLog.sim_time_offset_mins.desc())\
        .limit(10).all()
        
    return {
        "id": run.id,
        "status": run.status,
        "current_time": run.current_sim_time_offset_mins,
        "state": last_snap.state_json if last_snap else {},
        "metrics": last_snap.metrics_json if last_snap else {},
        "recent_events": [{"time": l.sim_time_offset_mins, "msg": l.message} for l in logs],
        "summary": run.results_summary_json
    }

@router.get("/history")
def get_simulation_history(db: Session = Depends(get_db)):
    """Returns simulation history for analytics."""
    runs = db.query(SimulationRun).filter(SimulationRun.status.in_(["COMPLETED", "FAILED"])).order_by(SimulationRun.completed_at.desc()).all()
    return [{"id": r.id, "scenario_id": r.scenario_id, "status": r.status, "completed_at": r.completed_at, "summary": r.results_summary_json} for r in runs]

@router.get("/types")
def get_simulation_types():
    """Returns enterprise simulation types."""
    return [
        {"id": "peak", "name": "Peak Load Stress Test", "description": "Simulate max demand."},
        {"id": "n1", "name": "N-1 Contingency", "description": "Simulate loss of asset."},
        {"id": "gen_fail", "name": "Generator Failure", "description": "Simulate loss of generation."},
        {"id": "trans_fail", "name": "Transmission Failure", "description": "Simulate line failure."},
        {"id": "renew_loss", "name": "Renewable Loss", "description": "Simulate drop in wind/solar."},
        {"id": "batt_fail", "name": "Battery Failure", "description": "Simulate battery loss."},
        {"id": "cyber", "name": "Cyber Attack", "description": "Simulate SCADA disruption."},
        {"id": "weather", "name": "Extreme Weather", "description": "Simulate storm impact."}
    ]

