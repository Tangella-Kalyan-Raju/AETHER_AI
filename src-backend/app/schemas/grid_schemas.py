from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
from datetime import datetime

class GridAssetBase(BaseModel):
    name: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    details: Optional[Dict[str, Any]] = None

class GridAssetCreate(GridAssetBase):
    organization_id: int

class GridAssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class GridAssetResponse(GridAssetBase):
    id: int
    organization_id: int
    created_by: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PolicyBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    is_active: Optional[bool] = False
    priority: Optional[int] = 1
    objective: Optional[str] = None
    weights: Optional[Dict[str, float]] = None
    constraints: Optional[Dict[str, Any]] = None
    ai_explanation: Optional[str] = None
    expected_outcome: Optional[str] = None
    affected_systems: Optional[List[str]] = None
    category: Optional[str] = None

class PolicyCreate(PolicyBase):
    organization_id: int
    status: Optional[str] = "active"

class PolicyResponse(PolicyBase):
    id: int
    organization_id: int
    created_by: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PolicyVersionCreate(BaseModel):
    policy_id: int
    version: str = Field(..., min_length=1)
    code_content: str = Field(..., min_length=1)

class PolicyVersionResponse(BaseModel):
    id: int
    policy_id: int
    version: str
    code_content: str
    created_by: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PolicyExecutionCreate(BaseModel):
    policy_version_id: int
    status: str
    details: Optional[Dict[str, Any]] = None
    execution_time: float

class PolicyExecutionResponse(BaseModel):
    id: int
    policy_version_id: int
    status: str
    details: Optional[Dict[str, Any]] = None
    execution_time: float
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    severity: str = Field(..., min_length=1)
    organization_id: int

class IncidentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    severity: str
    organization_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
