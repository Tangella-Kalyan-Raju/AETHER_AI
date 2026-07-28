from sqlalchemy import Column, String, Float, DateTime, JSON, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class ScenarioTemplate(Base):
    """
    Core repository model for predefined grid scenarios.
    Supports versioning via scenario_group_id.
    """
    __tablename__ = "scenario_templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Versioning group. Clones/Updates share this ID but get a new row with higher version.
    scenario_group_id = Column(String(36), default=generate_uuid, nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    is_latest = Column(Boolean, default=True, nullable=False)
    
    name = Column(String(100), nullable=False)
    description = Column(String(1000), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Enterprise categories: Operational, Emergency, Maintenance, Weather, Renewable, Market, Reliability, Custom
    category = Column(String(50), nullable=False)
    
    # Specific type: Morning Peak, N-1 Contingency, Generator Failure, Cyber Attack, etc.
    scenario_type = Column(String(100), nullable=False) 
    severity = Column(String(20), nullable=False) # Low, Medium, High, Critical
    status = Column(String(20), default="PUBLISHED", nullable=False) # DRAFT, PUBLISHED, ARCHIVED
    
    # Target scope & Global Configuration
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    time_horizon_hours = Column(Integer, default=24)
    weather_condition_json = Column(JSON, nullable=True) # e.g. {"temperature": 35, "condition": "Heatwave"}
    
    # Physical simulation parameters
    estimated_duration_mins = Column(Integer, default=60)
    trigger_conditions_json = Column(JSON, nullable=False)
    expected_outcomes_json = Column(JSON, nullable=True)
    forecast_snapshot_json = Column(JSON, nullable=True) # Static baseline forecast
    asset_selection_json = Column(JSON, nullable=True) # Specific assets involved
    
    tags = Column(String(255), nullable=True) # comma separated
    
    # Audit
    created_by = Column(String(100), nullable=False, default="system")
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)
    
    is_system_default = Column(Boolean, default=False)
    
    events = relationship("ScenarioEvent", back_populates="scenario", cascade="all, delete-orphan")

class ScenarioEvent(Base):
    """
    Represents a specific event on a scenario timeline.
    """
    __tablename__ = "scenario_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scenario_id = Column(String(36), ForeignKey("scenario_templates.id"), nullable=False)
    
    event_type = Column(String(50), nullable=False) # Weather, Demand, Battery, Failure, CyberAttack
    
    # Timeline
    start_offset_mins = Column(Integer, default=0, nullable=False)
    duration_mins = Column(Integer, default=60, nullable=False)
    
    # Impact
    target_assets_json = Column(JSON, nullable=True) # List of asset IDs affected
    parameters_json = Column(JSON, nullable=False) # Specific parameters (e.g. {"capacity_loss": 100})
    
    order_index = Column(Integer, default=0, nullable=False)
    
    scenario = relationship("ScenarioTemplate", back_populates="events")
