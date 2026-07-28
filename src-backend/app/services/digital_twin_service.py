"""
Phase 3.2 — Digital Twin Service Layer
Implements business validation, referential integrity checks, duplicate detection,
audit logging, UUID lookups, advanced search, and transaction management
for all Digital Twin asset operations.
"""
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.digital_twin_repository import (
    SubstationRepository, BusRepository, TransmissionLineRepository,
    TransformerRepository, GeneratorRepository, LoadRepository, SwitchRepository
)
from app.models.digital_twin_models import (
    Substation, Bus, TransmissionLine, Transformer, Generator, Load, Switch
)
from app.models.system_models import AuditLog

logger = logging.getLogger("gpo.service.digital_twin")


# ──────────────────────────────────────────────────────────
# Helper: Build paginated response dict
# ──────────────────────────────────────────────────────────
def _build_pagination_meta(result: Dict[str, Any]) -> Dict[str, Any]:
    """Transforms BaseRepository.get_page() output into standardized pagination meta."""
    page = result["page"]
    total_pages = result["total_pages"]
    has_next = page < total_pages
    has_prev = page > 1
    return {
        "page": page,
        "page_size": result["page_size"],
        "total_records": result["total"],
        "total_pages": total_pages,
        "current_page": page,
        "next_page": page + 1 if has_next else None,
        "previous_page": page - 1 if has_prev else None,
        "has_next": has_next,
        "has_prev": has_prev,
    }


# ──────────────────────────────────────────────────────────
# Helper: Write Audit Log
# ──────────────────────────────────────────────────────────
def _write_audit_log(
    db: Session,
    action: str,
    details: str,
    status_val: str = "success",
    user_id: Optional[int] = None,
) -> None:
    """Persist an audit trail entry for Digital Twin asset operations."""
    try:
        log = AuditLog(
            action=action,
            details=details,
            status=status_val,
        )
        # Set user_id if the column exists and value is provided
        if user_id and hasattr(log, "user_id"):
            log.user_id = user_id
        db.add(log)
        db.commit()
    except Exception as e:
        # Audit log failures should never break the main operation
        db.rollback()
        logger.warning(f"Failed to write audit log for '{action}': {e}")


# ──────────────────────────────────────────────────────────
# Helper: Build range filters from datetime params
# ──────────────────────────────────────────────────────────
def _build_date_range_filters(
    created_after: Optional[datetime] = None,
    created_before: Optional[datetime] = None,
    updated_after: Optional[datetime] = None,
    updated_before: Optional[datetime] = None,
) -> Dict:
    """Build range_filters dict for datetime columns."""
    range_filters = {}
    if created_after is not None or created_before is not None:
        range_filters["created_at"] = (created_after, created_before)
    if updated_after is not None or updated_before is not None:
        range_filters["updated_at"] = (updated_after, updated_before)
    return range_filters


# ──────────────────────────────────────────────────────────
# Substation Service
# ──────────────────────────────────────────────────────────
class SubstationService:
    """Business logic and validation for Substation operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = SubstationRepository(db)

    def create(self, data: dict) -> Substation:
        """Create a new substation after checking for duplicates."""
        existing = self.repo.get_by_name(data["name"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A substation with name '{data['name']}' already exists."
            )
        logger.info(f"Creating substation: {data['name']}")
        record = self.repo.create(data)
        _write_audit_log(self.db, "substation.create", f"Substation '{record.name}' created (ID: {record.id})")
        return record

    def get_by_id(self, substation_id: int) -> Substation:
        """Get a substation by ID or raise 404."""
        record = self.repo.get(substation_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Substation with ID {substation_id} not found."
            )
        return record

    def get_by_uuid(self, uuid: str) -> Substation:
        """Get a substation by UUID or raise 404."""
        record = self.repo.get_by_uuid(uuid)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Substation with UUID '{uuid}' not found."
            )
        return record

    def update(self, substation_id: int, data: dict) -> Substation:
        """Update a substation. Validate name uniqueness if name is changing."""
        existing = self.repo.get(substation_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Substation with ID {substation_id} not found."
            )
        if "name" in data and data["name"] != existing.name:
            duplicate = self.repo.get_by_name(data["name"])
            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"A substation with name '{data['name']}' already exists."
                )
        logger.info(f"Updating substation ID {substation_id}")
        record = self.repo.update(substation_id, data)
        _write_audit_log(self.db, "substation.update", f"Substation '{record.name}' updated (ID: {record.id})")
        return record

    def delete(self, substation_id: int) -> bool:
        """Soft-delete a substation."""
        existing = self.repo.get(substation_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Substation with ID {substation_id} not found."
            )
        name = existing.name
        logger.info(f"Deleting substation ID {substation_id}")
        result = self.repo.delete(substation_id, soft=True)
        _write_audit_log(self.db, "substation.delete", f"Substation '{name}' soft-deleted (ID: {substation_id})")
        return result

    def list_paginated(
        self, page: int, limit: int, search: Optional[str],
        sort_by: Optional[str], sort_order: str, filters: dict,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        updated_after: Optional[datetime] = None,
        updated_before: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """List substations with pagination, search, filtering, sorting, and date ranges."""
        range_filters = _build_date_range_filters(created_after, created_before, updated_after, updated_before)
        result = self.repo.get_page(
            page=page, page_size=limit, filters=filters,
            sort_by=sort_by, sort_order=sort_order,
            search_query=search, search_columns=["name", "uuid", "description"],
            range_filters=range_filters if range_filters else None,
        )
        return {"items": result["items"], "meta": _build_pagination_meta(result)}


# ──────────────────────────────────────────────────────────
# Bus Service
# ──────────────────────────────────────────────────────────
class BusService:
    """Business logic and validation for Bus operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = BusRepository(db)
        self.substation_repo = SubstationRepository(db)

    def _validate_substation(self, substation_id: int) -> None:
        """Ensure the referenced substation exists."""
        if not self.substation_repo.get(substation_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Referenced substation ID {substation_id} does not exist."
            )

    def create(self, data: dict) -> Bus:
        self._validate_substation(data["substation_id"])
        existing = self.repo.get_by_name(data["name"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A bus with name '{data['name']}' already exists."
            )
        logger.info(f"Creating bus: {data['name']}")
        record = self.repo.create(data)
        _write_audit_log(self.db, "bus.create", f"Bus '{record.name}' created (ID: {record.id})")
        return record

    def get_by_id(self, bus_id: int) -> Bus:
        record = self.repo.get(bus_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus with ID {bus_id} not found."
            )
        return record

    def get_by_uuid(self, uuid: str) -> Bus:
        """Get a bus by UUID or raise 404."""
        record = self.repo.get_by_uuid(uuid)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus with UUID '{uuid}' not found."
            )
        return record

    def update(self, bus_id: int, data: dict) -> Bus:
        existing = self.repo.get(bus_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus with ID {bus_id} not found."
            )
        if "substation_id" in data:
            self._validate_substation(data["substation_id"])
        if "name" in data and data["name"] != existing.name:
            duplicate = self.repo.get_by_name(data["name"])
            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"A bus with name '{data['name']}' already exists."
                )
        logger.info(f"Updating bus ID {bus_id}")
        record = self.repo.update(bus_id, data)
        _write_audit_log(self.db, "bus.update", f"Bus '{record.name}' updated (ID: {record.id})")
        return record

    def delete(self, bus_id: int) -> bool:
        existing = self.repo.get(bus_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus with ID {bus_id} not found."
            )
        name = existing.name
        logger.info(f"Deleting bus ID {bus_id}")
        result = self.repo.delete(bus_id, soft=True)
        _write_audit_log(self.db, "bus.delete", f"Bus '{name}' soft-deleted (ID: {bus_id})")
        return result

    def list_paginated(
        self, page: int, limit: int, search: Optional[str],
        sort_by: Optional[str], sort_order: str, filters: dict,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        updated_after: Optional[datetime] = None,
        updated_before: Optional[datetime] = None,
        min_voltage: Optional[float] = None,
        max_voltage: Optional[float] = None,
    ) -> Dict[str, Any]:
        range_filters = _build_date_range_filters(created_after, created_before, updated_after, updated_before)
        if min_voltage is not None or max_voltage is not None:
            range_filters["base_kv"] = (min_voltage, max_voltage)
        result = self.repo.get_page(
            page=page, page_size=limit, filters=filters,
            sort_by=sort_by, sort_order=sort_order,
            search_query=search, search_columns=["name", "uuid", "description"],
            range_filters=range_filters if range_filters else None,
        )
        return {"items": result["items"], "meta": _build_pagination_meta(result)}


# ──────────────────────────────────────────────────────────
# Transmission Line Service
# ──────────────────────────────────────────────────────────
class TransmissionLineService:
    """Business logic and validation for Transmission Line operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = TransmissionLineRepository(db)
        self.bus_repo = BusRepository(db)

    def _validate_buses(self, from_bus_id: int, to_bus_id: int) -> None:
        """Ensure both referenced buses exist."""
        if not self.bus_repo.get(from_bus_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Referenced from_bus_id {from_bus_id} does not exist."
            )
        if not self.bus_repo.get(to_bus_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Referenced to_bus_id {to_bus_id} does not exist."
            )

    def create(self, data: dict) -> TransmissionLine:
        self._validate_buses(data["from_bus_id"], data["to_bus_id"])
        existing = self.repo.get_by_name(data["name"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A transmission line with name '{data['name']}' already exists."
            )
        logger.info(f"Creating transmission line: {data['name']}")
        record = self.repo.create(data)
        _write_audit_log(self.db, "line.create", f"Transmission line '{record.name}' created (ID: {record.id})")
        return record

    def get_by_id(self, line_id: int) -> TransmissionLine:
        record = self.repo.get(line_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transmission line with ID {line_id} not found."
            )
        return record

    def get_by_uuid(self, uuid: str) -> TransmissionLine:
        """Get a transmission line by UUID or raise 404."""
        record = self.repo.get_by_uuid(uuid)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transmission line with UUID '{uuid}' not found."
            )
        return record

    def update(self, line_id: int, data: dict) -> TransmissionLine:
        existing = self.repo.get(line_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transmission line with ID {line_id} not found."
            )
        from_bus = data.get("from_bus_id", existing.from_bus_id)
        to_bus = data.get("to_bus_id", existing.to_bus_id)
        if from_bus == to_bus:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="from_bus_id and to_bus_id must be different."
            )
        if "from_bus_id" in data and not self.bus_repo.get(data["from_bus_id"]):
            raise HTTPException(status_code=400, detail=f"Referenced from_bus_id {data['from_bus_id']} does not exist.")
        if "to_bus_id" in data and not self.bus_repo.get(data["to_bus_id"]):
            raise HTTPException(status_code=400, detail=f"Referenced to_bus_id {data['to_bus_id']} does not exist.")
        if "name" in data and data["name"] != existing.name:
            duplicate = self.repo.get_by_name(data["name"])
            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"A transmission line with name '{data['name']}' already exists."
                )
        logger.info(f"Updating transmission line ID {line_id}")
        record = self.repo.update(line_id, data)
        _write_audit_log(self.db, "line.update", f"Transmission line '{record.name}' updated (ID: {record.id})")
        return record

    def delete(self, line_id: int) -> bool:
        existing = self.repo.get(line_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transmission line with ID {line_id} not found."
            )
        name = existing.name
        logger.info(f"Deleting transmission line ID {line_id}")
        result = self.repo.delete(line_id, soft=True)
        _write_audit_log(self.db, "line.delete", f"Transmission line '{name}' soft-deleted (ID: {line_id})")
        return result

    def list_paginated(
        self, page: int, limit: int, search: Optional[str],
        sort_by: Optional[str], sort_order: str, filters: dict,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        updated_after: Optional[datetime] = None,
        updated_before: Optional[datetime] = None,
        min_rating: Optional[float] = None,
        max_rating: Optional[float] = None,
    ) -> Dict[str, Any]:
        range_filters = _build_date_range_filters(created_after, created_before, updated_after, updated_before)
        if min_rating is not None or max_rating is not None:
            range_filters["rating_mva"] = (min_rating, max_rating)
        result = self.repo.get_page(
            page=page, page_size=limit, filters=filters,
            sort_by=sort_by, sort_order=sort_order,
            search_query=search, search_columns=["name", "uuid", "description"],
            range_filters=range_filters if range_filters else None,
        )
        return {"items": result["items"], "meta": _build_pagination_meta(result)}


# ──────────────────────────────────────────────────────────
# Transformer Service
# ──────────────────────────────────────────────────────────
class TransformerService:
    """Business logic and validation for Transformer operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = TransformerRepository(db)
        self.bus_repo = BusRepository(db)

    def _validate_buses(self, from_bus_id: int, to_bus_id: int) -> None:
        if not self.bus_repo.get(from_bus_id):
            raise HTTPException(status_code=400, detail=f"Referenced from_bus_id {from_bus_id} does not exist.")
        if not self.bus_repo.get(to_bus_id):
            raise HTTPException(status_code=400, detail=f"Referenced to_bus_id {to_bus_id} does not exist.")

    def create(self, data: dict) -> Transformer:
        self._validate_buses(data["from_bus_id"], data["to_bus_id"])
        existing = self.repo.get_by_name(data["name"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A transformer with name '{data['name']}' already exists."
            )
        logger.info(f"Creating transformer: {data['name']}")
        record = self.repo.create(data)
        _write_audit_log(self.db, "transformer.create", f"Transformer '{record.name}' created (ID: {record.id})")
        return record

    def get_by_id(self, transformer_id: int) -> Transformer:
        record = self.repo.get(transformer_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transformer with ID {transformer_id} not found."
            )
        return record

    def get_by_uuid(self, uuid: str) -> Transformer:
        """Get a transformer by UUID or raise 404."""
        record = self.repo.get_by_uuid(uuid)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transformer with UUID '{uuid}' not found."
            )
        return record

    def update(self, transformer_id: int, data: dict) -> Transformer:
        existing = self.repo.get(transformer_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transformer with ID {transformer_id} not found."
            )
        from_bus = data.get("from_bus_id", existing.from_bus_id)
        to_bus = data.get("to_bus_id", existing.to_bus_id)
        if from_bus == to_bus:
            raise HTTPException(status_code=400, detail="from_bus_id and to_bus_id must be different.")
        if "from_bus_id" in data and not self.bus_repo.get(data["from_bus_id"]):
            raise HTTPException(status_code=400, detail=f"Referenced from_bus_id {data['from_bus_id']} does not exist.")
        if "to_bus_id" in data and not self.bus_repo.get(data["to_bus_id"]):
            raise HTTPException(status_code=400, detail=f"Referenced to_bus_id {data['to_bus_id']} does not exist.")
        if "name" in data and data["name"] != existing.name:
            duplicate = self.repo.get_by_name(data["name"])
            if duplicate:
                raise HTTPException(status_code=409, detail=f"A transformer with name '{data['name']}' already exists.")
        logger.info(f"Updating transformer ID {transformer_id}")
        record = self.repo.update(transformer_id, data)
        _write_audit_log(self.db, "transformer.update", f"Transformer '{record.name}' updated (ID: {record.id})")
        return record

    def delete(self, transformer_id: int) -> bool:
        existing = self.repo.get(transformer_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transformer with ID {transformer_id} not found."
            )
        name = existing.name
        logger.info(f"Deleting transformer ID {transformer_id}")
        result = self.repo.delete(transformer_id, soft=True)
        _write_audit_log(self.db, "transformer.delete", f"Transformer '{name}' soft-deleted (ID: {transformer_id})")
        return result

    def list_paginated(
        self, page: int, limit: int, search: Optional[str],
        sort_by: Optional[str], sort_order: str, filters: dict,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        updated_after: Optional[datetime] = None,
        updated_before: Optional[datetime] = None,
        min_rating: Optional[float] = None,
        max_rating: Optional[float] = None,
    ) -> Dict[str, Any]:
        range_filters = _build_date_range_filters(created_after, created_before, updated_after, updated_before)
        if min_rating is not None or max_rating is not None:
            range_filters["rating_mva"] = (min_rating, max_rating)
        result = self.repo.get_page(
            page=page, page_size=limit, filters=filters,
            sort_by=sort_by, sort_order=sort_order,
            search_query=search, search_columns=["name", "uuid", "description"],
            range_filters=range_filters if range_filters else None,
        )
        return {"items": result["items"], "meta": _build_pagination_meta(result)}


# ──────────────────────────────────────────────────────────
# Generator Service
# ──────────────────────────────────────────────────────────
class GeneratorService:
    """Business logic and validation for Generator operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = GeneratorRepository(db)
        self.bus_repo = BusRepository(db)

    def _validate_bus(self, bus_id: int) -> None:
        if not self.bus_repo.get(bus_id):
            raise HTTPException(status_code=400, detail=f"Referenced bus_id {bus_id} does not exist.")

    def create(self, data: dict) -> Generator:
        self._validate_bus(data["bus_id"])
        existing = self.repo.get_by_name(data["name"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A generator with name '{data['name']}' already exists."
            )
        # Convert enum to string value for database storage
        if "type" in data and hasattr(data["type"], "value"):
            data["type"] = data["type"].value
        logger.info(f"Creating generator: {data['name']}")
        record = self.repo.create(data)
        _write_audit_log(self.db, "generator.create", f"Generator '{record.name}' created (ID: {record.id}, type: {record.type})")
        return record

    def get_by_id(self, generator_id: int) -> Generator:
        record = self.repo.get(generator_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Generator with ID {generator_id} not found."
            )
        return record

    def get_by_uuid(self, uuid: str) -> Generator:
        """Get a generator by UUID or raise 404."""
        record = self.repo.get_by_uuid(uuid)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Generator with UUID '{uuid}' not found."
            )
        return record

    def update(self, generator_id: int, data: dict) -> Generator:
        existing = self.repo.get(generator_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Generator with ID {generator_id} not found."
            )
        if "bus_id" in data:
            self._validate_bus(data["bus_id"])
        # Cross-validate power vs capacity
        p_mw = data.get("p_mw", existing.p_mw)
        capacity = data.get("capacity_mw", existing.capacity_mw)
        if p_mw > capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Active power output p_mw ({p_mw}) cannot exceed capacity_mw ({capacity})."
            )
        if "name" in data and data["name"] != existing.name:
            duplicate = self.repo.get_by_name(data["name"])
            if duplicate:
                raise HTTPException(status_code=409, detail=f"A generator with name '{data['name']}' already exists.")
        if "type" in data and hasattr(data["type"], "value"):
            data["type"] = data["type"].value
        logger.info(f"Updating generator ID {generator_id}")
        record = self.repo.update(generator_id, data)
        _write_audit_log(self.db, "generator.update", f"Generator '{record.name}' updated (ID: {record.id})")
        return record

    def delete(self, generator_id: int) -> bool:
        existing = self.repo.get(generator_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Generator with ID {generator_id} not found."
            )
        name = existing.name
        logger.info(f"Deleting generator ID {generator_id}")
        result = self.repo.delete(generator_id, soft=True)
        _write_audit_log(self.db, "generator.delete", f"Generator '{name}' soft-deleted (ID: {generator_id})")
        return result

    def list_paginated(
        self, page: int, limit: int, search: Optional[str],
        sort_by: Optional[str], sort_order: str, filters: dict,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        updated_after: Optional[datetime] = None,
        updated_before: Optional[datetime] = None,
        min_capacity: Optional[float] = None,
        max_capacity: Optional[float] = None,
    ) -> Dict[str, Any]:
        range_filters = _build_date_range_filters(created_after, created_before, updated_after, updated_before)
        if min_capacity is not None or max_capacity is not None:
            range_filters["capacity_mw"] = (min_capacity, max_capacity)
        result = self.repo.get_page(
            page=page, page_size=limit, filters=filters,
            sort_by=sort_by, sort_order=sort_order,
            search_query=search, search_columns=["name", "uuid", "description", "type"],
            range_filters=range_filters if range_filters else None,
        )
        return {"items": result["items"], "meta": _build_pagination_meta(result)}


# ──────────────────────────────────────────────────────────
# Load Service
# ──────────────────────────────────────────────────────────
class LoadService:
    """Business logic and validation for Load operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = LoadRepository(db)
        self.bus_repo = BusRepository(db)

    def _validate_bus(self, bus_id: int) -> None:
        if not self.bus_repo.get(bus_id):
            raise HTTPException(status_code=400, detail=f"Referenced bus_id {bus_id} does not exist.")

    def create(self, data: dict) -> Load:
        self._validate_bus(data["bus_id"])
        existing = self.repo.get_by_name(data["name"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A load with name '{data['name']}' already exists."
            )
        logger.info(f"Creating load: {data['name']}")
        record = self.repo.create(data)
        _write_audit_log(self.db, "load.create", f"Load '{record.name}' created (ID: {record.id})")
        return record

    def get_by_id(self, load_id: int) -> Load:
        record = self.repo.get(load_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Load with ID {load_id} not found."
            )
        return record

    def get_by_uuid(self, uuid: str) -> Load:
        """Get a load by UUID or raise 404."""
        record = self.repo.get_by_uuid(uuid)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Load with UUID '{uuid}' not found."
            )
        return record

    def update(self, load_id: int, data: dict) -> Load:
        existing = self.repo.get(load_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Load with ID {load_id} not found."
            )
        if "bus_id" in data:
            self._validate_bus(data["bus_id"])
        if "name" in data and data["name"] != existing.name:
            duplicate = self.repo.get_by_name(data["name"])
            if duplicate:
                raise HTTPException(status_code=409, detail=f"A load with name '{data['name']}' already exists.")
        logger.info(f"Updating load ID {load_id}")
        record = self.repo.update(load_id, data)
        _write_audit_log(self.db, "load.update", f"Load '{record.name}' updated (ID: {record.id})")
        return record

    def delete(self, load_id: int) -> bool:
        existing = self.repo.get(load_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Load with ID {load_id} not found."
            )
        name = existing.name
        logger.info(f"Deleting load ID {load_id}")
        result = self.repo.delete(load_id, soft=True)
        _write_audit_log(self.db, "load.delete", f"Load '{name}' soft-deleted (ID: {load_id})")
        return result

    def list_paginated(
        self, page: int, limit: int, search: Optional[str],
        sort_by: Optional[str], sort_order: str, filters: dict,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        updated_after: Optional[datetime] = None,
        updated_before: Optional[datetime] = None,
        min_power: Optional[float] = None,
        max_power: Optional[float] = None,
    ) -> Dict[str, Any]:
        range_filters = _build_date_range_filters(created_after, created_before, updated_after, updated_before)
        if min_power is not None or max_power is not None:
            range_filters["p_mw"] = (min_power, max_power)
        result = self.repo.get_page(
            page=page, page_size=limit, filters=filters,
            sort_by=sort_by, sort_order=sort_order,
            search_query=search, search_columns=["name", "uuid", "description"],
            range_filters=range_filters if range_filters else None,
        )
        return {"items": result["items"], "meta": _build_pagination_meta(result)}


# ──────────────────────────────────────────────────────────
# Switch Service
# ──────────────────────────────────────────────────────────
class SwitchService:
    """Business logic and validation for Switch/Breaker operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = SwitchRepository(db)
        self.bus_repo = BusRepository(db)
        self.line_repo = TransmissionLineRepository(db)

    def _validate_references(self, data: dict) -> None:
        """Validate that referenced line and bus IDs exist."""
        if "line_id" in data and data["line_id"] is not None:
            if not self.line_repo.get(data["line_id"]):
                raise HTTPException(status_code=400, detail=f"Referenced line_id {data['line_id']} does not exist.")
        if "bus_id" in data and data["bus_id"] is not None:
            if not self.bus_repo.get(data["bus_id"]):
                raise HTTPException(status_code=400, detail=f"Referenced bus_id {data['bus_id']} does not exist.")

    def create(self, data: dict) -> Switch:
        self._validate_references(data)
        existing = self.repo.get_by_name(data["name"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A switch with name '{data['name']}' already exists."
            )
        # Convert enum to string value for database storage
        if "state" in data and hasattr(data["state"], "value"):
            data["state"] = data["state"].value
        logger.info(f"Creating switch: {data['name']}")
        record = self.repo.create(data)
        _write_audit_log(self.db, "switch.create", f"Switch '{record.name}' created (ID: {record.id}, state: {record.state})")
        return record

    def get_by_id(self, switch_id: int) -> Switch:
        record = self.repo.get(switch_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Switch with ID {switch_id} not found."
            )
        return record

    def get_by_uuid(self, uuid: str) -> Switch:
        """Get a switch by UUID or raise 404."""
        record = self.repo.get_by_uuid(uuid)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Switch with UUID '{uuid}' not found."
            )
        return record

    def update(self, switch_id: int, data: dict) -> Switch:
        existing = self.repo.get(switch_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Switch with ID {switch_id} not found."
            )
        self._validate_references(data)
        if "name" in data and data["name"] != existing.name:
            duplicate = self.repo.get_by_name(data["name"])
            if duplicate:
                raise HTTPException(status_code=409, detail=f"A switch with name '{data['name']}' already exists.")
        if "state" in data and hasattr(data["state"], "value"):
            data["state"] = data["state"].value
        logger.info(f"Updating switch ID {switch_id}")
        record = self.repo.update(switch_id, data)
        _write_audit_log(self.db, "switch.update", f"Switch '{record.name}' updated (ID: {record.id})")
        return record

    def delete(self, switch_id: int) -> bool:
        existing = self.repo.get(switch_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Switch with ID {switch_id} not found."
            )
        name = existing.name
        logger.info(f"Deleting switch ID {switch_id}")
        result = self.repo.delete(switch_id, soft=True)
        _write_audit_log(self.db, "switch.delete", f"Switch '{name}' soft-deleted (ID: {switch_id})")
        return result

    def list_paginated(
        self, page: int, limit: int, search: Optional[str],
        sort_by: Optional[str], sort_order: str, filters: dict,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        updated_after: Optional[datetime] = None,
        updated_before: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        range_filters = _build_date_range_filters(created_after, created_before, updated_after, updated_before)
        result = self.repo.get_page(
            page=page, page_size=limit, filters=filters,
            sort_by=sort_by, sort_order=sort_order,
            search_query=search, search_columns=["name", "uuid", "description", "state"],
            range_filters=range_filters if range_filters else None,
        )
        return {"items": result["items"], "meta": _build_pagination_meta(result)}
