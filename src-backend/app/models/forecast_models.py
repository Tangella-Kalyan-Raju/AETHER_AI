from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, JSON
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class ForecastModelRegistry(Base):
    """Registry of active forecasting models and algorithms."""
    __tablename__ = "forecast_model_registry"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    domain = Column(String(50), nullable=False)  # weather, demand, solar, wind, carbon, storage
    version = Column(String(20), nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    is_active = Column(Integer, default=1) # SQLite boolean

class ForecastRecord(Base):
    """Individual prediction points across future horizons."""
    __tablename__ = "forecast_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("forecast_model_registry.id"), nullable=False)
    domain = Column(String(50), nullable=False)  # weather, demand, etc
    metric_name = Column(String(100), nullable=False) # e.g. temperature, total_demand
    
    # Times
    generated_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    target_timestamp = Column(DateTime(timezone=True), nullable=False) # The future time being predicted
    horizon_minutes = Column(Integer, nullable=False) # 30, 60, 180, etc
    
    # Values
    predicted_value = Column(Float, nullable=False)
    lower_bound = Column(Float)
    upper_bound = Column(Float)
    confidence_score = Column(Float) # 0 to 100
    
    # Actuals for validation (filled later)
    actual_value = Column(Float, nullable=True)
    error_absolute = Column(Float, nullable=True)
    
    # Extra context
    metadata_json = Column(JSON, nullable=True)

class ForecastValidationLog(Base):
    """Aggregate performance tracking of forecasting models."""
    __tablename__ = "forecast_validation_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("forecast_model_registry.id"), nullable=False)
    evaluated_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    samples_count = Column(Integer, default=0)
    mae = Column(Float) # Mean Absolute Error
    rmse = Column(Float) # Root Mean Square Error
    accuracy_percentage = Column(Float)

class Forecast(Base):
    """Enterprise forecasting model foundation."""
    __tablename__ = "forecasts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False) # Demand, Generation, Weather, etc.
    status = Column(String(50), default="Pending")
    version = Column(String(20), default="1.0")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)

class ForecastMetadata(Base):
    """Forecast metadata information."""
    __tablename__ = "forecast_metadata"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    forecast_id = Column(String(36), ForeignKey("forecasts.id"), nullable=False)
    data_source = Column(String(100))
    processing_duration_ms = Column(Integer)
    time_range_start = Column(DateTime(timezone=True))
    time_range_end = Column(DateTime(timezone=True))
    confidence_score = Column(Float)
    confidence_level = Column(String(20)) # High, Medium, Low
    extra_metadata = Column(JSON, nullable=True)

class ForecastConfiguration(Base):
    """Forecast execution configurations."""
    __tablename__ = "forecast_configurations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    forecast_id = Column(String(36), ForeignKey("forecasts.id"), nullable=False)
    parameters = Column(JSON, nullable=False)
    is_active = Column(Integer, default=1)

class ForecastSchedule(Base):
    """Scheduling configuration for automatic forecasts."""
    __tablename__ = "forecast_schedules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    forecast_id = Column(String(36), ForeignKey("forecasts.id"), nullable=False)
    cron_expression = Column(String(100), nullable=False)
    is_active = Column(Integer, default=1)
    last_run = Column(DateTime(timezone=True))
    next_run = Column(DateTime(timezone=True))

class ForecastHistory(Base):
    """Complete historical log of forecasting executions."""
    __tablename__ = "forecast_history"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    forecast_id = Column(String(36), ForeignKey("forecasts.id"), nullable=False)
    execution_timestamp = Column(DateTime(timezone=True), default=get_utc_now)
    status = Column(String(50), nullable=False)
    version = Column(String(20))
    logs = Column(JSON, nullable=True)
