from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.database.connection import get_db
from app.core.security import get_current_user
from app.services.scenarios.repository import ScenarioRepository
from app.services.scenarios.validation import ScenarioValidationEngine

router = APIRouter()

class ScenarioEventCreate(BaseModel):
    event_type: str
    start_offset_mins: int
    duration_mins: int
    target_assets_json: Optional[List[str]] = None
    parameters_json: Dict[str, Any]
    order_index: int

class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    notes: Optional[str] = None
    category: str
    scenario_type: str
    severity: str
    status: Optional[str] = "DRAFT"
    region: Optional[str] = None
    city: Optional[str] = None
    time_horizon_hours: Optional[int] = 24
    weather_condition_json: Optional[Dict[str, Any]] = None
    estimated_duration_mins: int = 60
    trigger_conditions_json: Dict[str, Any]
    expected_outcomes_json: Optional[Dict[str, Any]] = None
    forecast_snapshot_json: Optional[Dict[str, Any]] = None
    asset_selection_json: Optional[Dict[str, Any]] = None
    tags: Optional[str] = None
    events: Optional[List[ScenarioEventCreate]] = []

class ScenarioResponse(ScenarioCreate):
    id: str
    scenario_group_id: str
    version: int
    is_latest: bool
    created_by: str
    is_system_default: bool

@router.get("/", response_model=List[ScenarioResponse])
def get_scenarios(category: Optional[str] = None, db: Session = Depends(get_db)):
    repo = ScenarioRepository(db)
    return repo.get_all(category)

@router.post("/", response_model=ScenarioResponse)
def create_scenario(data: ScenarioCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    data_dict = data.dict()
    data_dict["created_by"] = current_user.email
    
    try:
        ScenarioValidationEngine.validate(data_dict)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    repo = ScenarioRepository(db)
    return repo.create(data_dict)

@router.post("/{scenario_id}/clone", response_model=ScenarioResponse)
def clone_scenario(scenario_id: str, data: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    data["created_by"] = current_user.email
    try:
        ScenarioValidationEngine.validate(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    repo = ScenarioRepository(db)
    try:
        return repo.clone_and_update(scenario_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/build", response_model=ScenarioResponse)
def build_scenario(data: ScenarioCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Deep build for Multi-Event scenarios."""
    data_dict = data.dict()
    data_dict["created_by"] = current_user.email
    
    try:
        ScenarioValidationEngine.validate(data_dict)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    repo = ScenarioRepository(db)
    return repo.create(data_dict)

@router.put("/{scenario_id}/status", response_model=ScenarioResponse)
def update_status(scenario_id: str, status: str, db: Session = Depends(get_db)):
    """Transitions a scenario between Draft and Published."""
    repo = ScenarioRepository(db)
    scenario = repo.get_by_id(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    scenario.status = status
    db.commit()
    db.refresh(scenario)
    return scenario
