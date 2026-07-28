import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class EngineeringRule(Base):
    """
    Configurable engineering thresholds that trigger alarms when violated by telemetry.
    """
    __tablename__ = "ops_engineering_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    asset_type = Column(String, index=True, nullable=False)        # e.g. "substation", "generator"
    measurement_type = Column(String, index=True, nullable=False)  # e.g. "voltage", "active_power"
    condition = Column(String, nullable=False)                     # ">", "<", "==", "!=", "OUT_OF_BOUNDS"
    threshold_value = Column(Float, nullable=False)
    secondary_threshold = Column(Float, nullable=True)             # for OUT_OF_BOUNDS
    severity = Column(String, nullable=False)                      # "Information", "Warning", "Minor", "Major", "Critical"
    is_active = Column(Boolean, default=True)
    description = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

class OperationalEvent(Base):
    """
    Immutable occurrence mapping to an asset or region.
    Generated either raw from telemetry or by the rule engine.
    """
    __tablename__ = "ops_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String, index=True, nullable=False)      # e.g. "THRESHOLD_EXCEEDED", "STATUS_CHANGE"
    event_category = Column(String, index=True, nullable=False)  # "Asset", "Grid", "Communication", "System"
    asset_id = Column(String, index=True, nullable=True)         # External or internal asset ID
    region = Column(String, index=True, nullable=True)
    severity = Column(String, index=True, nullable=False)
    source = Column(String, nullable=False)                      # e.g. "EventEngine", "SCADA"
    description = Column(String, nullable=False)
    metadata_json = Column(JSON, nullable=True)                  # Context (e.g. current_value, threshold_value)
    
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

class OperationalIncident(Base):
    """
    Aggregations of multiple events and alarms grouped by operators for root-cause tracking.
    """
    __tablename__ = "ops_incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="Open", index=True)          # "Open", "In Progress", "Resolved", "Closed"
    severity = Column(String, index=True, nullable=False)
    priority = Column(String, index=True, nullable=False)        # "Low", "Medium", "High", "Critical"
    asset_id = Column(String, index=True, nullable=True)
    region = Column(String, index=True, nullable=True)
    root_cause = Column(String, nullable=True)                   # Manual entry
    resolution_notes = Column(String, nullable=True)
    
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    assignee = relationship("User")
    alarms = relationship("OperationalAlarm", back_populates="incident")

class OperationalAlarm(Base):
    """
    State-machine tracking for actionable issues that operators must manage.
    """
    __tablename__ = "ops_alarms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alarm_type = Column(String, index=True, nullable=False)      # e.g. "Voltage High"
    asset_id = Column(String, index=True, nullable=False)
    region = Column(String, index=True, nullable=True)
    severity = Column(String, index=True, nullable=False)
    status = Column(String, default="Raised", index=True)        # "Raised", "Acknowledged", "Assigned", "In Progress", "Resolved", "Closed"
    description = Column(String, nullable=False)
    
    # Traceability back to the event that triggered this alarm
    trigger_event_id = Column(UUID(as_uuid=True), ForeignKey("ops_events.id", ondelete="SET NULL"), nullable=True)
    # Optional Incident linking
    incident_id = Column(UUID(as_uuid=True), ForeignKey("ops_incidents.id", ondelete="SET NULL"), nullable=True)
    
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    trigger_event = relationship("OperationalEvent")
    incident = relationship("OperationalIncident", back_populates="alarms")
    assignee = relationship("User")
