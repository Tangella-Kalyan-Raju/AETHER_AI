from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Base Models
class EngRegionBase(BaseModel):
    name: str = Field(..., max_length=255)
    state: Optional[str] = Field(None, max_length=100)
    zone: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class EngRegionCreate(EngRegionBase):
    pass

class EngRegionResponse(EngRegionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EngAssetBase(BaseModel):
    asset_type: str = Field(..., max_length=100)
    name: str = Field(..., max_length=255)
    region_id: str
    status: str = "active"

class EngAssetResponse(EngAssetBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Generator
class EngGeneratorBase(BaseModel):
    name: str
    region_id: str
    generator_type: str
    installed_capacity: float
    minimum_output: Optional[float] = None
    maximum_output: Optional[float] = None
    fuel_type: Optional[str] = None
    operating_cost: Optional[float] = None
    emission_factor: Optional[float] = None
    operational_status: Optional[str] = None

class EngGeneratorResponse(EngGeneratorBase):
    id: str
    
    class Config:
        from_attributes = True

# Transmission Line
class EngTransmissionLineBase(BaseModel):
    name: str
    region_id: str
    source_substation: str
    destination_substation: str
    voltage_level: Optional[float] = None
    line_length: Optional[float] = None
    thermal_limit: Optional[float] = None
    resistance: Optional[float] = None
    reactance: Optional[float] = None
    status: Optional[str] = None

class EngTransmissionLineResponse(EngTransmissionLineBase):
    id: str
    
    class Config:
        from_attributes = True

# Battery Storage
class EngBatteryStorageBase(BaseModel):
    name: str
    region_id: str
    capacity: float
    state_of_charge: Optional[float] = None
    charging_rate: Optional[float] = None
    discharging_rate: Optional[float] = None
    efficiency: Optional[float] = None

class EngBatteryStorageResponse(EngBatteryStorageBase):
    id: str
    
    class Config:
        from_attributes = True

# Renewables
class RenewableGenerationBase(BaseModel):
    type: str
    timestamp: datetime
    plant: str
    generation: float

class RenewableGenerationResponse(RenewableGenerationBase):
    id: str
    
    class Config:
        from_attributes = True

# Demand
class DemandProfileBase(BaseModel):
    region: str
    timestamp: datetime
    demand: float
    peak_demand: Optional[float] = None

class DemandProfileResponse(DemandProfileBase):
    id: str
    
    class Config:
        from_attributes = True

# Weather
class WeatherProfileBase(BaseModel):
    region_id: str
    timestamp: datetime
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    solar_irradiance: Optional[float] = None

class WeatherProfileResponse(WeatherProfileBase):
    id: str
    
    class Config:
        from_attributes = True
