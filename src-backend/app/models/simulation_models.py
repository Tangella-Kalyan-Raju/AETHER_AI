from sqlalchemy import Column, String, Float, DateTime, JSON, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class SimulationRun(Base):
    """
    Core engine representation of a simulation instance.
    """
    __tablename__ = "simulation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scenario_id = Column(String(36), ForeignKey("scenario_templates.id"), nullable=False)
    
    # QUEUED, INITIALIZING, RUNNING, PAUSED, COMPLETED, FAILED
    status = Column(String(20), default="QUEUED", nullable=False) 
    
    speed_multiplier = Column(Float, default=1.0, nullable=False) # 1x, 5x, 100x
    current_sim_time_offset_mins = Column(Integer, default=0, nullable=False)
    
    # Aggregated Result Summaries for quick comparison
    results_summary_json = Column(JSON, nullable=True)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_by = Column(String(100), nullable=False, default="operator")
    
    scenario = relationship("ScenarioTemplate")
    snapshots = relationship("SimulationStateSnapshot", back_populates="simulation", cascade="all, delete-orphan")
    event_logs = relationship("SimulationEventLog", back_populates="simulation", cascade="all, delete-orphan")


class SimulationStateSnapshot(Base):
    """
    Point-in-time snapshot of the isolated simulated grid state.
    Used for playback and timeline visualization.
    """
    __tablename__ = "simulation_state_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False)
    
    sim_time_offset_mins = Column(Integer, nullable=False)
    state_json = Column(JSON, nullable=False) # Complete digital twin snapshot at this tick
    metrics_json = Column(JSON, nullable=True) # Extracted KPI metrics for graphing
    
    recorded_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    
    simulation = relationship("SimulationRun", back_populates="snapshots")


class SimulationEventLog(Base):
    """
    Audit trail of actions that occurred during a specific simulation tick.
    """
    __tablename__ = "simulation_event_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False)
    
    sim_time_offset_mins = Column(Integer, nullable=False)
    event_category = Column(String(50), nullable=False) # SCENARIO_EVENT, FORECAST, OPTIMIZATION, AI, SYSTEM
    message = Column(String(500), nullable=False)
    metadata_json = Column(JSON, nullable=True)
    
    recorded_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    
    simulation = relationship("SimulationRun", back_populates="event_logs")
