import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, Float, JSON, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base

class EngRegion(Base):
    __tablename__ = "eng_regions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), index=True, nullable=False)
    state = Column(String(100), nullable=True)
    zone = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    assets = relationship("EngAsset", back_populates="region", cascade="all, delete-orphan")


class EngAsset(Base):
    __tablename__ = "eng_assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_type = Column(String(100), index=True, nullable=False)  # generator, substation, transmission_line, battery
    name = Column(String(255), index=True, nullable=False)
    region_id = Column(String(36), ForeignKey("eng_regions.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    region = relationship("EngRegion", back_populates="assets")


class EngGenerator(Base):
    __tablename__ = "eng_generators"

    id = Column(String(36), ForeignKey("eng_assets.id", ondelete="CASCADE"), primary_key=True)
    generator_type = Column(String(100), nullable=False)
    installed_capacity = Column(Float, nullable=False)
    minimum_output = Column(Float, nullable=True)
    maximum_output = Column(Float, nullable=True)
    fuel_type = Column(String(100), nullable=True)
    operating_cost = Column(Float, nullable=True)
    emission_factor = Column(Float, nullable=True)
    operational_status = Column(String(50), nullable=True)


class EngTransmissionLine(Base):
    __tablename__ = "eng_transmission_lines"

    id = Column(String(36), ForeignKey("eng_assets.id", ondelete="CASCADE"), primary_key=True)
    source_substation = Column(String(255), nullable=False)
    destination_substation = Column(String(255), nullable=False)
    voltage_level = Column(Float, nullable=True)
    line_length = Column(Float, nullable=True)
    thermal_limit = Column(Float, nullable=True)
    resistance = Column(Float, nullable=True)
    reactance = Column(Float, nullable=True)
    status = Column(String(50), nullable=True)


class EngBatteryStorage(Base):
    __tablename__ = "eng_battery_storage"

    id = Column(String(36), ForeignKey("eng_assets.id", ondelete="CASCADE"), primary_key=True)
    capacity = Column(Float, nullable=False)
    state_of_charge = Column(Float, nullable=True)
    charging_rate = Column(Float, nullable=True)
    discharging_rate = Column(Float, nullable=True)
    efficiency = Column(Float, nullable=True)


class RenewableGeneration(Base):
    __tablename__ = "eng_renewable_generation"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(50), index=True, nullable=False) # solar, wind
    timestamp = Column(DateTime, nullable=False, index=True)
    plant = Column(String(255), nullable=False, index=True)
    generation = Column(Float, nullable=False)


class DemandProfile(Base):
    __tablename__ = "eng_demand_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    region = Column(String(255), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    demand = Column(Float, nullable=False)
    peak_demand = Column(Float, nullable=True)

class EngWeatherProfile(Base):
    __tablename__ = "eng_weather_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    region_id = Column(String(36), index=True, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    solar_irradiance = Column(Float, nullable=True)
