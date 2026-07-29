from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.connection import get_db
from app.models.optimization_foundation_models import OptSession, OptRegistry, SimRegistry, OptConfiguration, OptHistory

router = APIRouter()

@router.get("/overview")
def get_optimization_overview(db: Session = Depends(get_db)):
    """Returns an overview of the optimization center status."""
    active_sessions = db.query(OptSession).filter(OptSession.status == "RUNNING").count()
    completed_sessions = db.query(OptSession).filter(OptSession.status == "COMPLETED").count()
    available_optimizations = db.query(OptRegistry).filter(OptRegistry.is_active == True).count()
    
    return {
        "status": "Operational",
        "active_sessions": active_sessions,
        "completed_sessions": completed_sessions,
        "available_optimizations": available_optimizations,
        "last_updated": "Just now"
    }

@router.get("/dashboard")
def get_optimization_dashboard(db: Session = Depends(get_db)):
    """Returns aggregated data for the Optimization Center dashboard."""
    return get_optimization_overview(db)

@router.get("/foundation-history", response_model=List[Dict[str, Any]])
def get_optimization_history(db: Session = Depends(get_db)):
    """Returns optimization history logs."""
    history = db.query(OptHistory).order_by(OptHistory.created_at.desc()).all()
    return [
        {
            "id": h.id,
            "session_id": h.session_id,
            "execution_duration_ms": h.execution_duration_ms,
            "status": h.status,
            "metadata": h.execution_metadata_json,
            "created_at": h.created_at
        }
        for h in history
    ]

@router.get("/sessions", response_model=List[Dict[str, Any]])
def get_optimization_sessions(db: Session = Depends(get_db)):
    """Returns all optimization sessions."""
    sessions = db.query(OptSession).order_by(OptSession.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "status": s.status,
            "owner": s.owner,
            "region": s.region,
            "metadata": s.metadata_json,
            "configuration": s.configuration_json,
            "created_at": s.created_at,
            "updated_at": s.updated_at
        }
        for s in sessions
    ]

@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_optimization_session(data: Dict[str, Any], db: Session = Depends(get_db)):
    """Creates a new optimization session placeholder."""
    name = data.get("name", "New Optimization Session")
    region = data.get("region", "Global")
    
    session = OptSession(
        name=name,
        region=region,
        status="IDLE",
        metadata_json=data.get("metadata", {}),
        configuration_json=data.get("configuration", {})
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {"message": "Session created successfully", "session_id": session.id}

@router.get("/sessions/{session_id}")
def get_session_by_id(session_id: str, db: Session = Depends(get_db)):
    """Returns a specific optimization session."""
    session = db.query(OptSession).filter(OptSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "id": session.id,
        "name": session.name,
        "status": session.status,
        "owner": session.owner,
        "region": session.region,
        "metadata": session.metadata_json,
        "configuration": session.configuration_json,
        "created_at": session.created_at,
        "updated_at": session.updated_at
    }

@router.get("/configuration")
def get_optimization_configuration(db: Session = Depends(get_db)):
    """Returns the global optimization configuration."""
    config = db.query(OptConfiguration).first()
    if not config:
        return {}
    
    return {
        "id": config.id,
        "default_region": config.default_region,
        "time_horizon_hours": config.time_horizon_hours,
        "default_confidence": config.default_confidence,
        "refresh_interval_ms": config.refresh_interval_ms,
        "cache_settings": config.cache_settings_json,
        "optimization_preferences": config.optimization_preferences_json,
        "updated_at": config.updated_at
    }

@router.put("/configuration")
def update_optimization_configuration(data: Dict[str, Any], db: Session = Depends(get_db)):
    """Updates the global optimization configuration."""
    config = db.query(OptConfiguration).first()
    if not config:
        config = OptConfiguration()
        db.add(config)
    
    if "default_region" in data:
        config.default_region = data["default_region"]
    if "time_horizon_hours" in data:
        config.time_horizon_hours = data["time_horizon_hours"]
    if "default_confidence" in data:
        config.default_confidence = data["default_confidence"]
    if "refresh_interval_ms" in data:
        config.refresh_interval_ms = data["refresh_interval_ms"]
    if "cache_settings" in data:
        config.cache_settings_json = data["cache_settings"]
    if "optimization_preferences" in data:
        config.optimization_preferences_json = data["optimization_preferences"]
        
    db.commit()
    db.refresh(config)
    return {"message": "Configuration updated successfully"}

@router.get("/types", response_model=List[Dict[str, Any]])
def get_optimization_types(db: Session = Depends(get_db)):
    """Returns the registry of optimization types."""
    types = db.query(OptRegistry).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "status": t.status,
            "planned_phase": t.planned_phase,
            "is_active": t.is_active,
            "created_at": t.created_at
        }
        for t in types
    ]

@router.get("/simulations", response_model=List[Dict[str, Any]])
def get_simulation_registry(db: Session = Depends(get_db)):
    """Returns the registry of simulations."""
    sims = db.query(SimRegistry).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "status": s.status,
            "planned_phase": s.planned_phase,
            "is_active": s.is_active,
            "created_at": s.created_at
        }
        for s in sims
    ]
