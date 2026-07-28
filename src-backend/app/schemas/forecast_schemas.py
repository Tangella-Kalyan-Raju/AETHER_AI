from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class ForecastBase(BaseModel):
    name: str
    type: str

class ForecastCreate(ForecastBase):
    pass

class ForecastResponse(ForecastBase):
    id: str
    status: str
    version: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ForecastMetadataBase(BaseModel):
    data_source: Optional[str] = None
    processing_duration_ms: Optional[int] = None
    time_range_start: Optional[datetime] = None
    time_range_end: Optional[datetime] = None
    confidence_score: Optional[float] = None
    confidence_level: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None

class ForecastMetadataResponse(ForecastMetadataBase):
    id: str
    forecast_id: str
    
    model_config = ConfigDict(from_attributes=True)

class ForecastConfigurationBase(BaseModel):
    parameters: Dict[str, Any]
    is_active: int = 1

class ForecastConfigurationUpdate(BaseModel):
    parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[int] = None

class ForecastConfigurationResponse(ForecastConfigurationBase):
    id: str
    forecast_id: str
    
    model_config = ConfigDict(from_attributes=True)

class ForecastScheduleBase(BaseModel):
    cron_expression: str
    is_active: int = 1

class ForecastScheduleResponse(ForecastScheduleBase):
    id: str
    forecast_id: str
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class ForecastHistoryResponse(BaseModel):
    id: str
    forecast_id: str
    execution_timestamp: datetime
    status: str
    version: Optional[str] = None
    logs: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)

class ForecastRunRequest(BaseModel):
    forecast_id: str
    parameters: Optional[Dict[str, Any]] = None
