from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

class IntegrationConfigBase(BaseModel):
    name: str = Field(..., description="Unique name of the connector")
    provider_type: str = Field(..., description="Type of provider (SCADA, PMU, IoT, etc.)")
    is_enabled: bool = True
    polling_interval: int = 5
    settings: Dict[str, Any] = {}

class IntegrationConfigCreate(IntegrationConfigBase):
    pass

class IntegrationConfigResponse(IntegrationConfigBase):
    id: uuid.UUID
    status: str
    last_heartbeat: Optional[datetime] = None
    messages_received: int
    errors: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class IntegrationHealthResponse(BaseModel):
    name: str
    provider_type: str
    status: str
    metrics: Dict[str, Any]
