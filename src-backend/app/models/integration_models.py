from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import Base

class IntegrationConfig(Base):
    __tablename__ = "integration_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    provider_type = Column(String, nullable=False)  # SCADA, PMU, etc.
    is_enabled = Column(Boolean, default=True)
    polling_interval = Column(Integer, default=5)  # seconds
    settings = Column(JSON, default={})  # Connection strings, API keys
    
    # Status tracking (could be separated, but kept here for simplicity)
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="DISCONNECTED")
    messages_received = Column(Integer, default=0)
    errors = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AssetMapping(Base):
    __tablename__ = "asset_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_type = Column(String, nullable=False, index=True)
    external_id = Column(String, nullable=False, index=True)
    internal_asset_id = Column(UUID(as_uuid=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TelemetryData(Base):
    __tablename__ = "telemetry_timeseries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("integration_configs.id"), nullable=True)
    asset_id = Column(UUID(as_uuid=True), index=True, nullable=True) # Can map to grid_assets
    metric_name = Column(String, index=True, nullable=False) # e.g., 'temperature', 'wind_speed', 'demand'
    value = Column(String, nullable=False) # String for flexible storage, cast on retrieval
    unit = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    quality_score = Column(Integer, default=100) # 0-100
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DataQualityLog(Base):
    __tablename__ = "data_quality_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("integration_configs.id"), nullable=False)
    issue_type = Column(String, nullable=False) # MISSING_VALUE, INVALID_RANGE, STALE
    description = Column(String, nullable=True)
    severity = Column(String, default="WARNING") # WARNING, CRITICAL
    timestamp = Column(DateTime(timezone=True), default=func.now())
