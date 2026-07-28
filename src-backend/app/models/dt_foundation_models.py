from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Integer
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class DigitalTwin(Base):
    """Central representation of the Digital Twin."""
    __tablename__ = "dt_instances"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, default="Primary Grid Twin")
    version = Column(String(20), nullable=False, default="1.0.0")
    status = Column(String(50), nullable=False, default="Active")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    last_synced_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class AssetRegistry(Base):
    """Generic asset wrapper linking physical assets to the twin."""
    __tablename__ = "dt_asset_registry"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    twin_id = Column(String(36), ForeignKey("dt_instances.id"), nullable=False)
    name = Column(String(200), nullable=False, index=True)
    type = Column(String(100), nullable=False, index=True) # e.g. Substation, TransmissionLine, SolarFarm
    region = Column(String(100), nullable=True, index=True)
    zone = Column(String(100), nullable=True)
    
    # Optional polymorphic link to specific detailed tables in digital_twin_models
    source_table = Column(String(100), nullable=True) # e.g. 'substations'
    source_id = Column(Integer, nullable=True)

class AssetMetadata(Base):
    """Metadata for assets in the registry."""
    __tablename__ = "dt_asset_metadata"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("dt_asset_registry.id"), nullable=False, index=True)
    installation_date = Column(DateTime(timezone=True), nullable=True)
    capacity = Column(Float, nullable=True) # General capacity parameter
    voltage_level = Column(Float, nullable=True)
    manufacturer = Column(String(100), nullable=True)
    extra_attributes = Column(JSON, nullable=True)

class AssetState(Base):
    """Real-time or simulated operational state."""
    __tablename__ = "dt_asset_states"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("dt_asset_registry.id"), nullable=False, index=True)
    operational_state = Column(String(50), nullable=False, default="Online")
    active_power = Column(Float, nullable=True)
    reactive_power = Column(Float, nullable=True)
    voltage = Column(Float, nullable=True)
    current = Column(Float, nullable=True)
    frequency = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    utilization_pct = Column(Float, nullable=True)
    battery_soc_pct = Column(Float, nullable=True)
    renewable_output = Column(Float, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class AssetHealth(Base):
    """Asset health monitoring."""
    __tablename__ = "dt_asset_health"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("dt_asset_registry.id"), nullable=False, index=True)
    health_score = Column(Float, nullable=False, default=100.0)
    health_status = Column(String(50), nullable=False, default="Nominal")
    availability_pct = Column(Float, nullable=False, default=100.0)
    maintenance_status = Column(String(100), nullable=False, default="None Required")
    last_inspected = Column(DateTime(timezone=True), nullable=True)

class GridTopology(Base):
    """Parent-child hierarchy and transmission paths."""
    __tablename__ = "dt_grid_topology"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    twin_id = Column(String(36), ForeignKey("dt_instances.id"), nullable=False)
    parent_asset_id = Column(String(36), ForeignKey("dt_asset_registry.id"), nullable=True, index=True)
    child_asset_id = Column(String(36), ForeignKey("dt_asset_registry.id"), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False) # e.g. 'Contains', 'ConnectedTo', 'Feeds'
    properties = Column(JSON, nullable=True)
