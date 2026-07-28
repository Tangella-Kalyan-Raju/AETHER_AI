from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class Prediction(Base):
    """Core prediction instance linking to a specific asset and horizon."""
    __tablename__ = "dt_predictions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("dt_asset_registry.id"), nullable=False, index=True)
    prediction_type = Column(String(50), nullable=False, index=True) # e.g. State, Failure, Congestion
    horizon_minutes = Column(Float, nullable=False) # e.g. 15, 60, 1440
    predicted_time = Column(DateTime(timezone=True), nullable=False, index=True)
    confidence_score = Column(Float, nullable=False, default=100.0)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    # Generic predicted values
    predicted_value_1 = Column(Float, nullable=True) # E.g. Active Power, or Failure Probability
    predicted_value_2 = Column(Float, nullable=True) # E.g. Voltage, or Severity
    predicted_status = Column(String(100), nullable=True)
    explanation = Column(String(500), nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)

class PredictionHistory(Base):
    """Archive of historical predictions for accuracy tracking."""
    __tablename__ = "dt_prediction_history"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    prediction_id = Column(String(36), nullable=False, index=True)
    asset_id = Column(String(36), nullable=False)
    predicted_time = Column(DateTime(timezone=True), nullable=False)
    actual_value_1 = Column(Float, nullable=True)
    error_margin = Column(Float, nullable=True)
    archived_at = Column(DateTime(timezone=True), default=get_utc_now)

class PredictionConfiguration(Base):
    """Configuration for prediction models and schedulers."""
    __tablename__ = "dt_prediction_config"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_name = Column(String(100), nullable=False)
    enabled = Column(String(10), default="true")
    interval_minutes = Column(Float, nullable=False, default=15.0)
    parameters = Column(JSON, nullable=True)
