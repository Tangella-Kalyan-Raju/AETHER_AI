from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base
import uuid
from datetime import datetime, timezone

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class OptRegistry(Base):
    """Registry of future optimization types."""
    __tablename__ = "opt_registry"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(255))
    status = Column(String(50), default="Coming Soon")
    planned_phase = Column(String(50))
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)


class SimRegistry(Base):
    """Registry of future simulations."""
    __tablename__ = "sim_registry"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(255))
    status = Column(String(50), default="Coming Soon")
    planned_phase = Column(String(50))
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)


class OptConfiguration(Base):
    """Global configuration settings for optimizations."""
    __tablename__ = "opt_configuration"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    default_region = Column(String(100), default="Global")
    time_horizon_hours = Column(Integer, default=24)
    default_confidence = Column(Float, default=0.90)
    refresh_interval_ms = Column(Integer, default=5000)
    cache_settings_json = Column(JSON, nullable=True)
    optimization_preferences_json = Column(JSON, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)


class OptSession(Base):
    """Optimization session management."""
    __tablename__ = "opt_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    status = Column(String(50), default="IDLE") # IDLE, RUNNING, COMPLETED, FAILED
    owner = Column(String(100), default="System")
    region = Column(String(100), default="Global")
    metadata_json = Column(JSON, nullable=True)
    configuration_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)


class OptHistory(Base):
    """Execution history of optimization runs."""
    __tablename__ = "opt_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("opt_sessions.id"), nullable=False)
    execution_duration_ms = Column(Integer, default=0)
    status = Column(String(50), nullable=False)
    execution_metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    session = relationship("OptSession")
