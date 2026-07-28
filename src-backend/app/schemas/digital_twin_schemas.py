"""
Phase 3.2 — Digital Twin Pydantic Schemas (DTOs)
Defines Request, Response, Update, Search, and Pagination schemas for all Digital Twin assets.
Includes OpenAPI examples, validation rules, and enterprise pagination metadata.
"""
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Any, Dict, List
from datetime import datetime
from enum import Enum


# ──────────────────────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────────────────────
class SwitchState(str, Enum):
    OPEN = "open"
    CLOSED = "closed"


class GeneratorType(str, Enum):
    THERMAL = "thermal"
    SOLAR = "solar"
    WIND = "wind"
    HYDRO = "hydro"
    GAS = "gas"
    NUCLEAR = "nuclear"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class AssetType(str, Enum):
    """Enumeration of all Digital Twin asset types for search/filter operations."""
    SUBSTATION = "substation"
    BUS = "bus"
    TRANSMISSION_LINE = "transmission_line"
    TRANSFORMER = "transformer"
    GENERATOR = "generator"
    LOAD = "load"
    SWITCH = "switch"


# ──────────────────────────────────────────────────────────
# Pagination DTOs
# ──────────────────────────────────────────────────────────
class PaginationMeta(BaseModel):
    """Standard pagination metadata envelope for all paginated responses."""
    page: int
    page_size: int
    total_records: int
    total_pages: int
    current_page: int
    next_page: Optional[int] = None
    previous_page: Optional[int] = None
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel):
    """Generic paginated response envelope wrapping records + pagination metadata."""
    records: List[Any]
    pagination: PaginationMeta


# ──────────────────────────────────────────────────────────
# Search & Filter DTOs
# ──────────────────────────────────────────────────────────
class AssetSearchRequest(BaseModel):
    """
    Unified search request DTO supporting multi-field search across all Digital Twin assets.
    Used for advanced search operations combining text search with structured filters.
    """
    query: Optional[str] = Field(None, max_length=500, description="Free-text search string (searches name, UUID, description)")
    asset_type: Optional[AssetType] = Field(None, description="Filter by asset type category")
    status: Optional[str] = Field(None, max_length=50, description="Filter by asset status (active, inactive, deleted)")
    substation_id: Optional[int] = Field(None, gt=0, description="Filter by parent substation ID")
    bus_id: Optional[int] = Field(None, gt=0, description="Filter by parent bus ID")
    min_voltage_kv: Optional[float] = Field(None, ge=0, description="Minimum voltage level in kV")
    max_voltage_kv: Optional[float] = Field(None, ge=0, description="Maximum voltage level in kV")
    min_capacity_mw: Optional[float] = Field(None, ge=0, description="Minimum capacity in MW")
    max_capacity_mw: Optional[float] = Field(None, ge=0, description="Maximum capacity in MW")
    min_rating_mva: Optional[float] = Field(None, ge=0, description="Minimum rating in MVA")
    max_rating_mva: Optional[float] = Field(None, ge=0, description="Maximum rating in MVA")
    generator_type: Optional[GeneratorType] = Field(None, description="Filter generators by fuel/technology type")
    switch_state: Optional[SwitchState] = Field(None, description="Filter switches by state (open/closed)")
    created_after: Optional[datetime] = Field(None, description="Filter records created after this timestamp")
    created_before: Optional[datetime] = Field(None, description="Filter records created before this timestamp")
    updated_after: Optional[datetime] = Field(None, description="Filter records updated after this timestamp")
    updated_before: Optional[datetime] = Field(None, description="Filter records updated before this timestamp")
    metadata_keyword: Optional[str] = Field(None, max_length=255, description="Search within metadata JSON fields")
    page: int = Field(1, ge=1, description="Page number for pagination")
    page_size: int = Field(20, ge=1, le=100, description="Number of records per page")
    sort_by: Optional[str] = Field(None, description="Column name to sort results by")
    sort_order: SortOrder = Field(SortOrder.DESC, description="Sort direction: asc or desc")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "query": "Sierra",
                    "status": "active",
                    "min_voltage_kv": 100.0,
                    "page": 1,
                    "page_size": 20,
                    "sort_by": "name",
                    "sort_order": "asc"
                }
            ]
        }
    }


# ──────────────────────────────────────────────────────────
# Bulk Operation DTOs
# ──────────────────────────────────────────────────────────
class BulkDeleteRequest(BaseModel):
    """Request DTO for batch-deleting multiple assets by ID."""
    ids: List[int] = Field(..., min_length=1, max_length=100, description="List of asset IDs to delete (max 100)")


class BulkOperationResponse(BaseModel):
    """Response DTO for batch operations showing individual results."""
    total_requested: int
    total_succeeded: int
    total_failed: int
    results: List[Dict[str, Any]]


# ──────────────────────────────────────────────────────────
# Substation Schemas
# ──────────────────────────────────────────────────────────
class SubstationCreate(BaseModel):
    """Request DTO for creating a new Substation."""
    name: str = Field(..., min_length=1, max_length=255, description="Unique substation name")
    description: Optional[str] = Field(None, max_length=2000, description="Description of the substation")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Geographic latitude")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Geographic longitude")
    metadata_json: Optional[Dict[str, Any]] = Field(None, description="Custom metadata as JSON")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Downtown Substation Alpha",
                    "description": "Primary distribution substation serving the downtown grid sector",
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "metadata_json": {"region": "west", "tier": "primary"}
                }
            ]
        }
    }


class SubstationUpdate(BaseModel):
    """Request DTO for updating a Substation. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    version: Optional[int] = Field(None, description='Concurrency check version number')
    status: Optional[str] = Field(None, max_length=50)
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Downtown Substation Alpha - Renamed",
                    "status": "maintenance"
                }
            ]
        }
    }


class SubstationResponse(BaseModel):
    """Response DTO for Substation data."""
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    metadata_json: Optional[Dict[str, Any]] = None
    version: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────────────────
# Bus Schemas
# ──────────────────────────────────────────────────────────
class BusCreate(BaseModel):
    """Request DTO for creating a new Bus node."""
    name: str = Field(..., min_length=1, max_length=255, description="Unique bus name")
    description: Optional[str] = Field(None, max_length=2000)
    base_kv: float = Field(..., gt=0, description="Base voltage in kilovolts (must be > 0)")
    substation_id: int = Field(..., gt=0, description="Parent substation ID")
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Bus A - 138kV",
                    "description": "High voltage bus at Downtown Substation",
                    "base_kv": 138.0,
                    "substation_id": 1
                }
            ]
        }
    }


class BusUpdate(BaseModel):
    """Request DTO for updating a Bus. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    base_kv: Optional[float] = Field(None, gt=0)
    substation_id: Optional[int] = Field(None, gt=0)
    version: Optional[int] = Field(None, description='Concurrency check version number')
    status: Optional[str] = Field(None, max_length=50)
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "base_kv": 230.0,
                    "status": "active"
                }
            ]
        }
    }


class BusResponse(BaseModel):
    """Response DTO for Bus data."""
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    base_kv: float
    substation_id: int
    status: str
    metadata_json: Optional[Dict[str, Any]] = None
    version: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────────────────
# Transmission Line Schemas
# ──────────────────────────────────────────────────────────
class TransmissionLineCreate(BaseModel):
    """Request DTO for creating a new Transmission Line."""
    name: str = Field(..., min_length=1, max_length=255, description="Unique line name")
    description: Optional[str] = Field(None, max_length=2000)
    from_bus_id: int = Field(..., gt=0, description="Source bus ID")
    to_bus_id: int = Field(..., gt=0, description="Destination bus ID")
    r_pu: float = Field(0.01, ge=0, description="Resistance per unit")
    x_pu: float = Field(0.05, ge=0, description="Reactance per unit")
    b_pu: float = Field(0.02, ge=0, description="Susceptance per unit")
    rating_mva: float = Field(100.0, gt=0, description="Line rating in MVA (must be > 0)")
    metadata_json: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def validate_bus_ids_different(self):
        if self.from_bus_id == self.to_bus_id:
            raise ValueError("from_bus_id and to_bus_id must be different (cannot create a self-loop)")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Sierra-Reno Line 1",
                    "description": "138kV transmission line connecting Sierra and Reno substations",
                    "from_bus_id": 1,
                    "to_bus_id": 2,
                    "r_pu": 0.01,
                    "x_pu": 0.05,
                    "b_pu": 0.02,
                    "rating_mva": 150.0
                }
            ]
        }
    }


class TransmissionLineUpdate(BaseModel):
    """Request DTO for updating a Transmission Line. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    from_bus_id: Optional[int] = Field(None, gt=0)
    to_bus_id: Optional[int] = Field(None, gt=0)
    r_pu: Optional[float] = Field(None, ge=0)
    x_pu: Optional[float] = Field(None, ge=0)
    b_pu: Optional[float] = Field(None, ge=0)
    rating_mva: Optional[float] = Field(None, gt=0)
    version: Optional[int] = Field(None, description='Concurrency check version number')
    status: Optional[str] = Field(None, max_length=50)
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "rating_mva": 200.0,
                    "status": "active"
                }
            ]
        }
    }


class TransmissionLineResponse(BaseModel):
    """Response DTO for Transmission Line data."""
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    from_bus_id: int
    to_bus_id: int
    r_pu: float
    x_pu: float
    b_pu: float
    rating_mva: float
    status: str
    metadata_json: Optional[Dict[str, Any]] = None
    version: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────────────────
# Transformer Schemas
# ──────────────────────────────────────────────────────────
class TransformerCreate(BaseModel):
    """Request DTO for creating a new Transformer."""
    name: str = Field(..., min_length=1, max_length=255, description="Unique transformer name")
    description: Optional[str] = Field(None, max_length=2000)
    from_bus_id: int = Field(..., gt=0, description="Primary side bus ID")
    to_bus_id: int = Field(..., gt=0, description="Secondary side bus ID")
    r_pu: float = Field(0.005, ge=0, description="Resistance per unit")
    x_pu: float = Field(0.04, ge=0, description="Reactance per unit")
    rating_mva: float = Field(50.0, gt=0, description="Transformer rating in MVA (must be > 0)")
    metadata_json: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def validate_bus_ids_different(self):
        if self.from_bus_id == self.to_bus_id:
            raise ValueError("from_bus_id and to_bus_id must be different (cannot create a self-loop transformer)")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Step-Down Transformer T1",
                    "description": "138kV to 69kV step-down transformer",
                    "from_bus_id": 1,
                    "to_bus_id": 3,
                    "r_pu": 0.005,
                    "x_pu": 0.04,
                    "rating_mva": 100.0
                }
            ]
        }
    }


class TransformerUpdate(BaseModel):
    """Request DTO for updating a Transformer. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    from_bus_id: Optional[int] = Field(None, gt=0)
    to_bus_id: Optional[int] = Field(None, gt=0)
    r_pu: Optional[float] = Field(None, ge=0)
    x_pu: Optional[float] = Field(None, ge=0)
    rating_mva: Optional[float] = Field(None, gt=0)
    version: Optional[int] = Field(None, description='Concurrency check version number')
    status: Optional[str] = Field(None, max_length=50)
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "rating_mva": 75.0
                }
            ]
        }
    }


class TransformerResponse(BaseModel):
    """Response DTO for Transformer data."""
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    from_bus_id: int
    to_bus_id: int
    r_pu: float
    x_pu: float
    rating_mva: float
    status: str
    metadata_json: Optional[Dict[str, Any]] = None
    version: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────────────────
# Generator Schemas
# ──────────────────────────────────────────────────────────
class GeneratorCreate(BaseModel):
    """Request DTO for creating a new Generator."""
    name: str = Field(..., min_length=1, max_length=255, description="Unique generator name")
    description: Optional[str] = Field(None, max_length=2000)
    bus_id: int = Field(..., gt=0, description="Parent bus ID")
    type: GeneratorType = Field(GeneratorType.THERMAL, description="Generation fuel/technology type")
    capacity_mw: float = Field(100.0, gt=0, description="Maximum rated capacity in MW (must be > 0)")
    p_mw: float = Field(0.0, ge=0, description="Active power output in MW")
    q_mvar: float = Field(0.0, description="Reactive power output in MVAR")
    metadata_json: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def validate_power_within_capacity(self):
        if self.p_mw > self.capacity_mw:
            raise ValueError(f"Active power output p_mw ({self.p_mw}) cannot exceed capacity_mw ({self.capacity_mw})")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Sierra Gas Turbine Gen-1",
                    "description": "Natural gas peaker unit at Sierra Substation",
                    "bus_id": 1,
                    "type": "gas",
                    "capacity_mw": 250.0,
                    "p_mw": 180.0,
                    "q_mvar": 45.0
                }
            ]
        }
    }


class GeneratorUpdate(BaseModel):
    """Request DTO for updating a Generator. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    bus_id: Optional[int] = Field(None, gt=0)
    type: Optional[GeneratorType] = None
    capacity_mw: Optional[float] = Field(None, gt=0)
    p_mw: Optional[float] = Field(None, ge=0)
    q_mvar: Optional[float] = None
    version: Optional[int] = Field(None, description='Concurrency check version number')
    status: Optional[str] = Field(None, max_length=50)
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "p_mw": 200.0,
                    "q_mvar": 50.0
                }
            ]
        }
    }


class GeneratorResponse(BaseModel):
    """Response DTO for Generator data."""
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    bus_id: int
    type: str
    capacity_mw: float
    p_mw: float
    q_mvar: float
    status: str
    metadata_json: Optional[Dict[str, Any]] = None
    version: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────────────────
# Load Schemas
# ──────────────────────────────────────────────────────────
class LoadCreate(BaseModel):
    """Request DTO for creating a new Load."""
    name: str = Field(..., min_length=1, max_length=255, description="Unique load name")
    description: Optional[str] = Field(None, max_length=2000)
    bus_id: int = Field(..., gt=0, description="Parent bus ID")
    p_mw: float = Field(0.0, ge=0, description="Active power demand in MW")
    q_mvar: float = Field(0.0, description="Reactive power demand in MVAR")
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Industrial Load Zone A",
                    "description": "Heavy industrial load cluster in zone A",
                    "bus_id": 2,
                    "p_mw": 75.0,
                    "q_mvar": 20.0
                }
            ]
        }
    }


class LoadUpdate(BaseModel):
    """Request DTO for updating a Load. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    bus_id: Optional[int] = Field(None, gt=0)
    p_mw: Optional[float] = Field(None, ge=0)
    q_mvar: Optional[float] = None
    version: Optional[int] = Field(None, description='Concurrency check version number')
    status: Optional[str] = Field(None, max_length=50)
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "p_mw": 80.0,
                    "status": "active"
                }
            ]
        }
    }


class LoadResponse(BaseModel):
    """Response DTO for Load data."""
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    bus_id: int
    p_mw: float
    q_mvar: float
    status: str
    metadata_json: Optional[Dict[str, Any]] = None
    version: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────────────────
# Switch Schemas
# ──────────────────────────────────────────────────────────
class SwitchCreate(BaseModel):
    """Request DTO for creating a new Switch/Breaker."""
    name: str = Field(..., min_length=1, max_length=255, description="Unique switch name")
    description: Optional[str] = Field(None, max_length=2000)
    line_id: Optional[int] = Field(None, gt=0, description="Associated transmission line ID")
    bus_id: Optional[int] = Field(None, gt=0, description="Associated bus ID")
    state: SwitchState = Field(SwitchState.CLOSED, description="Switch position: 'open' or 'closed'")
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Breaker CB-101",
                    "description": "Circuit breaker protecting Line 1 at Bus A",
                    "line_id": 1,
                    "bus_id": 1,
                    "state": "closed"
                }
            ]
        }
    }


class SwitchUpdate(BaseModel):
    """Request DTO for updating a Switch. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    line_id: Optional[int] = Field(None, gt=0)
    bus_id: Optional[int] = Field(None, gt=0)
    version: Optional[int] = Field(None, description='Concurrency check version number')
    state: Optional[SwitchState] = None
    status: Optional[str] = Field(None, max_length=50)
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "state": "open",
                    "status": "active"
                }
            ]
        }
    }


class SwitchResponse(BaseModel):
    """Response DTO for Switch data."""
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    line_id: Optional[int] = None
    bus_id: Optional[int] = None
    state: str
    status: str
    metadata_json: Optional[Dict[str, Any]] = None
    version: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
