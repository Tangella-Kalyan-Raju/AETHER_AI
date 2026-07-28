from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from enum import Enum

class QualityFlag(str, Enum):
    GOOD = "GOOD"
    BAD = "BAD"
    UNCERTAIN = "UNCERTAIN"
    ESTIMATED = "ESTIMATED"
    MISSING = "MISSING"
    INVALID = "INVALID"

class AssetStatus(str, Enum):
    HEALTHY = "Healthy"
    WARNING = "Warning"
    CRITICAL = "Critical"
    OFFLINE = "Offline"
    MAINTENANCE = "Maintenance"
    UNKNOWN = "Unknown"

class MeasurementBase(BaseModel):
    asset_id: str = Field(..., description="Unique identifier for the asset")
    asset_type: str = Field(..., description="Type of asset (e.g. substation, generator)")
    measurement_type: str = Field(..., description="Type of measurement (e.g. voltage, power_active)")
    value: float = Field(..., description="Measured value")
    unit: str = Field(..., description="Engineering unit (e.g. kV, MW, Hz)")
    timestamp: datetime = Field(..., description="Time of measurement")
    source: Optional[str] = Field("api", description="Source of the measurement data")

class MeasurementCreate(MeasurementBase):
    @field_validator("value")
    @classmethod
    def validate_value(cls, v: float, info) -> float:
        """Apply some basic physics/engineering validation where possible."""
        measurement_type = info.data.get("measurement_type", "")
        if measurement_type.lower() in ["frequency", "hz"]:
            if v < 0:
                raise ValueError("Frequency cannot be negative.")
        if measurement_type.lower() in ["voltage", "kv"]:
            if v < 0:
                raise ValueError("Voltage magnitude cannot be negative.")
        return v

class MeasurementBulkCreate(BaseModel):
    measurements: List[MeasurementCreate] = Field(..., max_length=5000, description="List of measurements to ingest")

class MeasurementResponse(MeasurementBase):
    id: str
    quality: QualityFlag
    confidence: float
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class AssetHealthResponse(BaseModel):
    asset_id: str
    asset_type: str
    status: AssetStatus
    last_updated: datetime
    active_alarms: int
    health_score: float = Field(..., ge=0, le=100)
