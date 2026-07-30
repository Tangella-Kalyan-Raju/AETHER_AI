import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base

class DashboardSummary(Base):
    __tablename__ = "dashboard_summaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    grid_health = Column(Float, nullable=False, default=100.0)
    current_demand = Column(Float, nullable=False, default=0.0)
    current_generation = Column(Float, nullable=False, default=0.0)
    reserve_margin = Column(Float, nullable=False, default=0.0)
    renewable_pct = Column(Float, nullable=False, default=0.0)
    grid_frequency = Column(Float, nullable=False, default=50.00)
    co2_emissions = Column(Float, nullable=False, default=0.0)
    operating_cost = Column(Float, nullable=False, default=0.0)
    power_balance = Column(Float, nullable=False, default=0.0)
    active_policy = Column(String(100), nullable=False, default="Balanced Mode")
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class WeatherTelemetry(Base):
    __tablename__ = "weather_telemetries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    region = Column(String(100), nullable=False, default="Hyderabad")
    temperature = Column(Float, nullable=False, default=25.0)
    humidity = Column(Float, nullable=False, default=60.0)
    wind_speed = Column(Float, nullable=False, default=10.0)
    cloud_cover = Column(Float, nullable=False, default=0.0)
    pressure = Column(Float, nullable=False, default=1013.25)
    visibility = Column(Float, nullable=False, default=10.0)
    sunrise = Column(String(50), nullable=True)
    sunset = Column(String(50), nullable=True)
    weather_alerts = Column(JSON, nullable=True)  # List of weather alerts
    weather_impact = Column(String(255), nullable=True)
    forecast_summary = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class GenerationSourceTelemetry(Base):
    __tablename__ = "generation_source_telemetries"

    id = Column(String(50), primary_key=True, index=True) # e.g. solar, wind
    name = Column(String(100), nullable=False)
    current_generation = Column(Float, nullable=False, default=0.0)
    capacity = Column(Float, nullable=False, default=0.0)
    percentage = Column(Float, nullable=False, default=0.0)
    trend = Column(String(50), nullable=False, default="STABLE") # UP, DOWN, STABLE
    status = Column(String(50), nullable=False, default="Online") # Online, Standby, Offline
    details = Column(JSON, nullable=True)

class GenerationHistory(Base):
    __tablename__ = "generation_histories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(String(50), ForeignKey("generation_source_telemetries.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    value = Column(Float, nullable=False)

class DemandHistory(Base):
    __tablename__ = "demand_histories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    value = Column(Float, nullable=False)
    is_forecast = Column(Boolean, default=False, nullable=False)

class BatteryStatus(Base):
    __tablename__ = "battery_statuses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    soc = Column(Float, nullable=False, default=80.0)
    charge_rate = Column(Float, nullable=False, default=0.0)
    discharge_rate = Column(Float, nullable=False, default=0.0)
    health = Column(Float, nullable=False, default=100.0)
    remaining_cycles = Column(Integer, nullable=False, default=5000)
    backup_time = Column(Float, nullable=False, default=8.0) # Hours
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class GridStatusTelemetry(Base):
    __tablename__ = "grid_status_telemetries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    current_load = Column(Float, nullable=False, default=0.0)
    available_capacity = Column(Float, nullable=False, default=0.0)
    reserve_margin = Column(Float, nullable=False, default=0.0)
    operating_region = Column(String(100), nullable=False, default="Northern Regional Grid")
    power_flow = Column(Float, nullable=False, default=0.0)
    current_status = Column(String(50), nullable=False, default="NORMAL")
    grid_frequency = Column(Float, nullable=False, default=50.00)
    grid_stability = Column(Float, nullable=False, default=100.00)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class DashboardAlert(Base):
    __tablename__ = "dashboard_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    severity = Column(String(50), nullable=False, index=True) # Critical, High, Medium, Low
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="Active") # Active, Acknowledged, Resolved

class DashboardEvent(Base):
    __tablename__ = "dashboard_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False, default="info")
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class PolicyHistory(Base):
    __tablename__ = "policy_histories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    policy_name = Column(String(100), nullable=False)
    applied_by = Column(String(100), nullable=True)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    reason = Column(Text, nullable=True)

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    columns = Column(JSON, nullable=True) # Detected columns metadata
    row_count = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="uploaded") # uploaded, processing, completed, failed
    analytics_status = Column(String(50), nullable=False, default="pending") # pending, processing, completed, failed
    analytics_data = Column(JSON, nullable=True) # AI summary, statistics, charts
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    versions = relationship("DatasetVersion", back_populates="dataset", cascade="all, delete-orphan")
    records = relationship("DatasetRecord", back_populates="dataset", cascade="all, delete-orphan")

class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    description = Column(String(255), nullable=True)
    imported_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    dataset = relationship("Dataset", back_populates="versions")

class DatasetRecord(Base):
    __tablename__ = "dataset_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    region = Column(String(100), nullable=True)
    plant_name = Column(String(255), nullable=True)
    plant_type = Column(String(100), nullable=True)
    installed_capacity = Column(Float, nullable=True)
    current_generation = Column(Float, nullable=True)
    demand = Column(Float, nullable=True)
    renewable_output = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    solar_irradiance = Column(Float, nullable=True)

    dataset = relationship("Dataset", back_populates="records")


class GenerationForecast(Base):
    __tablename__ = "generation_forecasts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(String(50), nullable=False, index=True)
    target_timestamp = Column(DateTime, nullable=False, index=True)
    predicted_value = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False, default=100.0)
    lower_bound = Column(Float, nullable=True)
    upper_bound = Column(Float, nullable=True)


class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    target_timestamp = Column(DateTime, nullable=False, index=True)
    temperature = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    cloud_cover = Column(Float, nullable=False)
    solar_irradiance = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False, default=100.0)
    forecast_type = Column(String(50), nullable=False) # 24h, 48h, 7d


class WeatherTimeline(Base):
    __tablename__ = "weather_timelines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_time = Column(DateTime, nullable=False, index=True)
    event_type = Column(String(100), nullable=False) # Storm Incoming, Heavy Rain, Night Cycle, etc.
    description = Column(String(255), nullable=False)
    timeline_phase = Column(String(50), nullable=False) # past, current, future


class WeatherImpact(Base):
    __tablename__ = "weather_impacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    parameter = Column(String(100), nullable=False) # Cloud Cover, Storm Alert, Extreme Heat, etc.
    change_type = Column(String(50), nullable=False) # Increase, Alert, High, etc.
    impacted_source = Column(String(50), nullable=False) # solar, wind, etc.
    mw_variation = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False) # Critical, High, Medium, Low
    recommendation = Column(String(255), nullable=False)


class RenewablePrediction(Base):
    __tablename__ = "renewable_predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    solar_ghi = Column(Float, nullable=False)
    wind_velocity = Column(Float, nullable=False)
    potential_index = Column(Float, nullable=False) # 0 to 100
    efficiency = Column(Float, nullable=False) # 0 to 100


class GenerationInsight(Base):
    __tablename__ = "generation_insights"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(String(50), nullable=False, index=True)
    explanation = Column(Text, nullable=False)
    recommendation = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=False, default=100.0)
    potential_savings = Column(Float, nullable=True)
    co2_reduction = Column(Float, nullable=True)


class WeatherConfidence(Base):
    __tablename__ = "weather_confidences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    forecast_domain = Column(String(50), nullable=False) # wind, solar, rain, demand
    confidence_score = Column(Float, nullable=False)


class GenerationHealth(Base):
    __tablename__ = "generation_healths"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(String(50), nullable=False, index=True)
    health_score = Column(Float, nullable=False, default=100.0)
    maintenance_status = Column(String(100), nullable=False, default="Nominal")
    efficiency = Column(Float, nullable=False, default=100.0)


class GenerationCost(Base):
    __tablename__ = "generation_costs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(String(50), nullable=False, index=True)
    operating_cost_mwh = Column(Float, nullable=False)


class CO2Statistic(Base):
    __tablename__ = "co2_statistics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(String(50), nullable=False, index=True)
    emissions_g_kwh = Column(Float, nullable=False)

