from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

# --- Engineering Rules ---
class EngineeringRuleBase(BaseModel):
    name: str
    asset_type: str
    measurement_type: str
    condition: str
    threshold_value: float
    secondary_threshold: Optional[float] = None
    severity: str
    is_active: bool = True
    description: Optional[str] = None

class EngineeringRuleCreate(EngineeringRuleBase):
    pass

class EngineeringRuleResponse(EngineeringRuleBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# --- Events ---
class OperationalEventBase(BaseModel):
    event_type: str
    event_category: str
    asset_id: Optional[str] = None
    region: Optional[str] = None
    severity: str
    source: str
    description: str
    metadata_json: Optional[Dict[str, Any]] = None

class OperationalEventCreate(OperationalEventBase):
    pass

class OperationalEventResponse(OperationalEventBase):
    id: uuid.UUID
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Alarms ---
class OperationalAlarmBase(BaseModel):
    alarm_type: str
    asset_id: str
    region: Optional[str] = None
    severity: str
    description: str
    notes: Optional[str] = None

class OperationalAlarmCreate(OperationalAlarmBase):
    trigger_event_id: Optional[uuid.UUID] = None

class OperationalAlarmResponse(OperationalAlarmBase):
    id: uuid.UUID
    status: str
    trigger_event_id: Optional[uuid.UUID] = None
    incident_id: Optional[uuid.UUID] = None
    assigned_to: Optional[int] = None
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Incidents ---
class OperationalIncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str
    priority: str
    asset_id: Optional[str] = None
    region: Optional[str] = None

class OperationalIncidentCreate(OperationalIncidentBase):
    alarm_ids: Optional[List[uuid.UUID]] = []

class OperationalIncidentResponse(OperationalIncidentBase):
    id: uuid.UUID
    status: str
    root_cause: Optional[str] = None
    resolution_notes: Optional[str] = None
    assigned_to: Optional[int] = None
    created_at: datetime
    closed_at: Optional[datetime] = None
    alarms: List[OperationalAlarmResponse] = []

    class Config:
        from_attributes = True
