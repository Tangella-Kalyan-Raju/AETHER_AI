"""
Phase 3.2 — Digital Twin Repository Layer
Concrete repository implementations for all Digital Twin asset models,
extending BaseRepository with asset-specific query helpers, range queries,
and optimized lookup methods.
"""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.models.digital_twin_models import (
    Substation, Bus, TransmissionLine, Transformer, Generator, Load, Switch
)


class SubstationRepository(BaseRepository[Substation]):
    """Repository for Substation database operations."""
    def __init__(self, db: Session):
        super().__init__(db, Substation)

    def get_by_uuid(self, uuid: str) -> Optional[Substation]:
        """Fetch a substation by its UUID."""
        return self.find_one({"uuid": uuid})

    def get_by_name(self, name: str) -> Optional[Substation]:
        """Fetch a substation by its exact name."""
        return self.find_one({"name": name})

    def get_by_coordinates_range(
        self, lat_range: Tuple[float, float], lon_range: Tuple[float, float]
    ) -> List[Substation]:
        """Fetch substations within a geographic bounding box."""
        query = self.db.query(Substation).filter(
            Substation.is_deleted == False,
            Substation.latitude >= lat_range[0],
            Substation.latitude <= lat_range[1],
            Substation.longitude >= lon_range[0],
            Substation.longitude <= lon_range[1],
        )
        return query.all()


class BusRepository(BaseRepository[Bus]):
    """Repository for Bus database operations."""
    def __init__(self, db: Session):
        super().__init__(db, Bus)

    def get_by_uuid(self, uuid: str) -> Optional[Bus]:
        """Fetch a bus by its UUID."""
        return self.find_one({"uuid": uuid})

    def get_by_name(self, name: str) -> Optional[Bus]:
        """Fetch a bus by its exact name."""
        return self.find_one({"name": name})

    def get_by_substation(self, substation_id: int) -> List[Bus]:
        """Fetch all buses belonging to a specific substation."""
        return self.find_by({"substation_id": substation_id})

    def get_by_voltage_range(self, min_kv: float, max_kv: float) -> List[Bus]:
        """Fetch buses with base_kv within a specified range."""
        query = self.db.query(Bus).filter(
            Bus.is_deleted == False,
            Bus.base_kv >= min_kv,
            Bus.base_kv <= max_kv,
        )
        return query.all()


class TransmissionLineRepository(BaseRepository[TransmissionLine]):
    """Repository for Transmission Line database operations."""
    def __init__(self, db: Session):
        super().__init__(db, TransmissionLine)

    def get_by_uuid(self, uuid: str) -> Optional[TransmissionLine]:
        """Fetch a transmission line by its UUID."""
        return self.find_one({"uuid": uuid})

    def get_by_name(self, name: str) -> Optional[TransmissionLine]:
        """Fetch a transmission line by its exact name."""
        return self.find_one({"name": name})

    def get_by_bus(self, bus_id: int) -> List[TransmissionLine]:
        """Fetch all transmission lines connected to a specific bus (either end)."""
        from sqlalchemy import or_
        query = self.db.query(TransmissionLine).filter(
            TransmissionLine.is_deleted == False,
            or_(
                TransmissionLine.from_bus_id == bus_id,
                TransmissionLine.to_bus_id == bus_id,
            ),
        )
        return query.all()

    def get_by_rating_range(self, min_mva: float, max_mva: float) -> List[TransmissionLine]:
        """Fetch transmission lines with rating_mva within a specified range."""
        query = self.db.query(TransmissionLine).filter(
            TransmissionLine.is_deleted == False,
            TransmissionLine.rating_mva >= min_mva,
            TransmissionLine.rating_mva <= max_mva,
        )
        return query.all()


class TransformerRepository(BaseRepository[Transformer]):
    """Repository for Transformer database operations."""
    def __init__(self, db: Session):
        super().__init__(db, Transformer)

    def get_by_uuid(self, uuid: str) -> Optional[Transformer]:
        """Fetch a transformer by its UUID."""
        return self.find_one({"uuid": uuid})

    def get_by_name(self, name: str) -> Optional[Transformer]:
        """Fetch a transformer by its exact name."""
        return self.find_one({"name": name})

    def get_by_bus(self, bus_id: int) -> List[Transformer]:
        """Fetch all transformers connected to a specific bus (either side)."""
        from sqlalchemy import or_
        query = self.db.query(Transformer).filter(
            Transformer.is_deleted == False,
            or_(
                Transformer.from_bus_id == bus_id,
                Transformer.to_bus_id == bus_id,
            ),
        )
        return query.all()

    def get_by_rating_range(self, min_mva: float, max_mva: float) -> List[Transformer]:
        """Fetch transformers with rating_mva within a specified range."""
        query = self.db.query(Transformer).filter(
            Transformer.is_deleted == False,
            Transformer.rating_mva >= min_mva,
            Transformer.rating_mva <= max_mva,
        )
        return query.all()


class GeneratorRepository(BaseRepository[Generator]):
    """Repository for Generator database operations."""
    def __init__(self, db: Session):
        super().__init__(db, Generator)

    def get_by_uuid(self, uuid: str) -> Optional[Generator]:
        """Fetch a generator by its UUID."""
        return self.find_one({"uuid": uuid})

    def get_by_name(self, name: str) -> Optional[Generator]:
        """Fetch a generator by its exact name."""
        return self.find_one({"name": name})

    def get_by_bus(self, bus_id: int) -> List[Generator]:
        """Fetch all generators connected to a specific bus."""
        return self.find_by({"bus_id": bus_id})

    def get_by_type(self, gen_type: str) -> List[Generator]:
        """Fetch all generators of a specific type."""
        return self.find_by({"type": gen_type})

    def get_by_capacity_range(self, min_mw: float, max_mw: float) -> List[Generator]:
        """Fetch generators with capacity_mw within a specified range."""
        query = self.db.query(Generator).filter(
            Generator.is_deleted == False,
            Generator.capacity_mw >= min_mw,
            Generator.capacity_mw <= max_mw,
        )
        return query.all()


class LoadRepository(BaseRepository[Load]):
    """Repository for Load database operations."""
    def __init__(self, db: Session):
        super().__init__(db, Load)

    def get_by_uuid(self, uuid: str) -> Optional[Load]:
        """Fetch a load by its UUID."""
        return self.find_one({"uuid": uuid})

    def get_by_name(self, name: str) -> Optional[Load]:
        """Fetch a load by its exact name."""
        return self.find_one({"name": name})

    def get_by_bus(self, bus_id: int) -> List[Load]:
        """Fetch all loads connected to a specific bus."""
        return self.find_by({"bus_id": bus_id})

    def get_by_power_range(self, min_mw: float, max_mw: float) -> List[Load]:
        """Fetch loads with p_mw within a specified range."""
        query = self.db.query(Load).filter(
            Load.is_deleted == False,
            Load.p_mw >= min_mw,
            Load.p_mw <= max_mw,
        )
        return query.all()


class SwitchRepository(BaseRepository[Switch]):
    """Repository for Switch database operations."""
    def __init__(self, db: Session):
        super().__init__(db, Switch)

    def get_by_uuid(self, uuid: str) -> Optional[Switch]:
        """Fetch a switch by its UUID."""
        return self.find_one({"uuid": uuid})

    def get_by_name(self, name: str) -> Optional[Switch]:
        """Fetch a switch by its exact name."""
        return self.find_one({"name": name})

    def get_by_line(self, line_id: int) -> List[Switch]:
        """Fetch all switches associated with a specific transmission line."""
        return self.find_by({"line_id": line_id})

    def get_by_bus(self, bus_id: int) -> List[Switch]:
        """Fetch all switches associated with a specific bus."""
        return self.find_by({"bus_id": bus_id})

    def get_by_state(self, state: str) -> List[Switch]:
        """Fetch all switches by their current state (open/closed)."""
        return self.find_by({"state": state})
