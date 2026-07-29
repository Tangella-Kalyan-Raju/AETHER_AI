from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base, BaseModelMixin
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class AssetCategory(Base, BaseModelMixin):
    __tablename__ = "asset_categories"

    name = Column(String(100), unique=True, index=True, nullable=False) # e.g., Generation, Storage, Transmission, Distribution
    description = Column(String(255), nullable=True)

    assets = relationship("Asset", back_populates="category")

class Asset(Base, BaseModelMixin):
    __tablename__ = "assets"

    asset_id = Column(String(100), unique=True, index=True, nullable=False, default=generate_uuid)
    name = Column(String(255), index=True, nullable=False)
    type = Column(String(100), index=True, nullable=False)  # e.g., Solar Farm, Wind Farm, Generator, etc.
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("asset_categories.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    category = relationship("AssetCategory", back_populates="assets")
    location = relationship("AssetLocation", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    metadata_relation = relationship("app.models.asset_models.AssetMetadata", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    registry = relationship("app.models.asset_models.AssetRegistry", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    history = relationship("AssetHistory", back_populates="asset", cascade="all, delete-orphan")
    health = relationship("app.models.asset_models.AssetHealth", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    maintenance = relationship("AssetMaintenance", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    inspections = relationship("InspectionRecord", back_populates="asset", cascade="all, delete-orphan")
    services = relationship("ServiceRecord", back_populates="asset", cascade="all, delete-orphan")
    ai_insights = relationship("AssetAIInsight", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    recommendation_history = relationship("AssetRecommendationHistory", back_populates="asset", cascade="all, delete-orphan")
    lifecycle = relationship("AssetLifecycle", back_populates="asset", uselist=False, cascade="all, delete-orphan")

class AssetLocation(Base, BaseModelMixin):
    __tablename__ = "asset_locations"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True)
    address = Column(String(512), nullable=True)
    region = Column(String(100), index=True, nullable=False)
    zone = Column(String(100), nullable=True)
    substation = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    asset = relationship("Asset", back_populates="location")

class AssetMetadata(Base, BaseModelMixin):
    __tablename__ = "asset_metadata"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True)
    voltage_level = Column(Float, nullable=True) # in kV
    capacity = Column(Float, nullable=True) # in MW / MVA
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    owner = Column(String(100), nullable=True)
    installation_date = Column(DateTime, nullable=True)
    commission_date = Column(DateTime, nullable=True)
    tags = Column(JSON, nullable=True) # Array of strings
    extra_attributes = Column(JSON, nullable=True) # Specific details like panel count, turbine count, battery type, etc.

    asset = relationship("Asset", back_populates="metadata_relation")

class AssetHierarchy(Base, BaseModelMixin):
    __tablename__ = "asset_hierarchy"

    parent_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=True)
    child_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True)
    level = Column(String(50), nullable=False) # e.g. Grid, Region, Transmission Network, Substation, Feeder, Asset

    parent = relationship("Asset", foreign_keys=[parent_id])
    child = relationship("Asset", foreign_keys=[child_id])

class AssetConfiguration(Base, BaseModelMixin):
    __tablename__ = "asset_configurations"

    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)

class AssetHistory(Base, BaseModelMixin):
    __tablename__ = "asset_histories"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False) # Registration, Configuration Update, Metadata Change, Status Change, etc.
    changed_by = Column(String(100), nullable=True)
    before_value = Column(JSON, nullable=True)
    after_value = Column(JSON, nullable=True)
    audit_timestamp = Column(DateTime, default=get_utc_now, nullable=False)

    asset = relationship("Asset", back_populates="history")

class AssetRegistry(Base, BaseModelMixin):
    __tablename__ = "asset_registry"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True)
    registered_at = Column(DateTime, default=get_utc_now, nullable=False)
    registration_status = Column(String(50), default="Completed", nullable=False)
    notes = Column(Text, nullable=True)

    asset = relationship("Asset", back_populates="registry")

class AssetHealth(Base, BaseModelMixin):
    __tablename__ = "asset_health"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True)
    health_score = Column(Float, nullable=False, default=100.0)
    condition = Column(String(50), nullable=False, default="Nominal") # Nominal, Warning, Critical
    remaining_useful_life = Column(Float, nullable=True) # in years
    efficiency = Column(Float, nullable=True) # percentage
    temperature = Column(Float, nullable=True) # degrees Celsius
    performance_index = Column(Float, nullable=True) # 0-100
    utilization = Column(Float, nullable=True) # percentage
    availability = Column(Float, nullable=True) # percentage

    asset = relationship("Asset", back_populates="health")

class AssetMaintenance(Base, BaseModelMixin):
    __tablename__ = "asset_maintenance"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True)
    predicted_failure = Column(DateTime, nullable=True)
    failure_probability = Column(Float, nullable=True) # 0.0 to 1.0
    criticality_score = Column(Float, nullable=True) # 0-100
    maintenance_priority = Column(String(50), nullable=False, default="Low") # Low, Medium, High, Critical
    maintenance_schedule = Column(DateTime, nullable=True) # planned date

    asset = relationship("Asset", back_populates="maintenance")

class InspectionRecord(Base, BaseModelMixin):
    __tablename__ = "inspection_records"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    inspected_at = Column(DateTime, default=get_utc_now, nullable=False)
    inspector = Column(String(100), nullable=True)
    result = Column(String(100), nullable=False) # Passed, Failed, Needs Action
    notes = Column(Text, nullable=True)

    asset = relationship("Asset", back_populates="inspections")

class ServiceRecord(Base, BaseModelMixin):
    __tablename__ = "service_records"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    serviced_at = Column(DateTime, default=get_utc_now, nullable=False)
    technician = Column(String(100), nullable=True)
    cost = Column(Float, nullable=True)
    description = Column(Text, nullable=True)

    asset = relationship("Asset", back_populates="services")

class AssetAIInsight(Base, BaseModelMixin):
    __tablename__ = "asset_ai_insights"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    recommendation = Column(Text, nullable=False)
    reasoning = Column(JSON, nullable=True) # Dict of reasons (why health changed, why fail probability increased, expected actions, impact)
    root_cause = Column(Text, nullable=True)
    failure_explanation = Column(Text, nullable=True)
    maintenance_suggestion = Column(Text, nullable=True)
    operational_advice = Column(Text, nullable=True)
    replacement_recommendation = Column(Text, nullable=True)
    spare_part_recommendation = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=False, default=1.0)
    priority = Column(String(50), nullable=False, default="Low") # Low, Medium, High, Critical
    expected_impact = Column(Text, nullable=True)

    asset = relationship("Asset", back_populates="ai_insights")

class AssetRecommendationHistory(Base, BaseModelMixin):
    __tablename__ = "asset_recommendation_history"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation = Column(Text, nullable=False)
    priority = Column(String(55), nullable=False, default="Low")
    action_taken = Column(String(100), nullable=False, default="Pending") # Pending, Approved, Dismissed
    operator_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    asset = relationship("Asset", back_populates="recommendation_history")

class AssetLifecycle(Base, BaseModelMixin):
    __tablename__ = "asset_lifecycles"

    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    stage = Column(String(100), nullable=False, default="In Service") # In Service, Under Maintenance, End of Life, Decommissioned
    age = Column(Float, nullable=False, default=0.0) # years
    remaining_useful_life = Column(Float, nullable=True) # years
    maintenance_cost = Column(Float, nullable=False, default=0.0) # $
    replacement_cost = Column(Float, nullable=False, default=0.0) # $
    downtime_hours = Column(Float, nullable=False, default=0.0)
    uptime_hours = Column(Float, nullable=False, default=0.0)
    availability = Column(Float, nullable=False, default=100.0) # %
    performance_benchmark = Column(Float, nullable=False, default=100.0) # 0-100 score
    efficiency_trend = Column(Float, nullable=True) # percentage change/year
    criticality_ranking = Column(Integer, nullable=True)
    lifecycle_cost = Column(Float, nullable=False, default=0.0) # $
    risk_ranking = Column(Integer, nullable=True)

    asset = relationship("Asset", back_populates="lifecycle")



