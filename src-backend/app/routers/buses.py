"""
Phase 3.2 — Bus REST API Router
Full CRUD (GET, POST, PUT, PATCH, DELETE), UUID lookup, search, filtering
by substation/status/voltage range, sorting, pagination, and date range filtering for Bus nodes.
"""
import logging
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import PermissionGuard
from app.core.response import send_success
from app.models.auth_models import User
from app.services.digital_twin_service import BusService
from app.schemas.digital_twin_schemas import (
    BusCreate, BusUpdate, BusResponse, SortOrder
)

logger = logging.getLogger("gpo.api.buses")
router = APIRouter()


@router.get(
    "",
    response_model=dict,
    summary="List all Buses",
    description="Retrieve a paginated list of buses with optional search, filtering by substation, status, "
                "voltage range, date ranges, and sorting by name, base_kv, created_at, or updated_at.",
    responses={200: {"description": "Paginated list of buses with metadata"}},
)
def list_buses(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Records per page"),
    search: Optional[str] = Query(None, description="Search by name, UUID, or description"),
    sort_by: Optional[str] = Query(None, description="Sort field (name, base_kv, created_at, updated_at)"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort direction"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    substation_id: Optional[int] = Query(None, description="Filter by parent substation ID"),
    min_voltage: Optional[float] = Query(None, ge=0, description="Minimum base voltage in kV"),
    max_voltage: Optional[float] = Query(None, ge=0, description="Maximum base voltage in kV"),
    created_after: Optional[datetime] = Query(None, description="Filter: created after this ISO timestamp"),
    created_before: Optional[datetime] = Query(None, description="Filter: created before this ISO timestamp"),
    updated_after: Optional[datetime] = Query(None, description="Filter: updated after this ISO timestamp"),
    updated_before: Optional[datetime] = Query(None, description="Filter: updated before this ISO timestamp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = BusService(db)
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if substation_id:
        filters["substation_id"] = substation_id
    result = service.list_paginated(
        page, limit, search, sort_by, sort_order.value, filters,
        created_after=created_after, created_before=created_before,
        updated_after=updated_after, updated_before=updated_before,
        min_voltage=min_voltage, max_voltage=max_voltage,
    )
    records = [BusResponse.model_validate(r).model_dump() for r in result["items"]]
    return send_success(records, meta=result["meta"])


@router.get(
    "/uuid/{uuid}",
    response_model=dict,
    summary="Get Bus by UUID",
    description="Retrieve a single bus node by its universally unique identifier (UUID).",
    responses={200: {"description": "Bus details"}, 404: {"description": "Bus not found"}},
)
def get_bus_by_uuid(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = BusService(db)
    record = service.get_by_uuid(uuid)
    return send_success(BusResponse.model_validate(record).model_dump())


@router.get(
    "/{bus_id}",
    response_model=dict,
    summary="Get Bus by ID",
    description="Retrieve a single bus node by its primary key ID.",
    responses={200: {"description": "Bus details"}, 404: {"description": "Bus not found"}},
)
def get_bus(
    bus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = BusService(db)
    record = service.get_by_id(bus_id)
    return send_success(BusResponse.model_validate(record).model_dump())


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Bus",
    description="Create a new bus node in the Digital Twin grid model. Requires a valid parent substation. "
                "Name must be unique. Voltage must be positive.",
    responses={
        201: {"description": "Bus created"},
        400: {"description": "Invalid substation reference"},
        409: {"description": "Duplicate name"},
        422: {"description": "Validation error"},
    },
)
def create_bus(
    req: BusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = BusService(db)
    data = req.model_dump()
    record = service.create(data)
    logger.info(f"User {current_user.email} created bus '{record.name}'")
    return send_success(BusResponse.model_validate(record).model_dump())


@router.put(
    "/{bus_id}",
    response_model=dict,
    summary="Update a Bus (Full)",
    description="Full update of an existing bus node. Only provided fields are changed. "
                "Validates substation FK if changed. Validates name uniqueness if changed.",
    responses={
        200: {"description": "Bus updated"},
        404: {"description": "Not found"},
        409: {"description": "Duplicate name"},
    },
)
def update_bus(
    bus_id: int,
    req: BusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = BusService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(bus_id, data)
    logger.info(f"User {current_user.email} updated bus ID {bus_id}")
    return send_success(BusResponse.model_validate(record).model_dump())


@router.patch(
    "/{bus_id}",
    response_model=dict,
    summary="Partially Update a Bus",
    description="Partial update — only the provided fields are modified. Unspecified fields remain unchanged.",
    responses={
        200: {"description": "Bus partially updated"},
        404: {"description": "Not found"},
        409: {"description": "Duplicate name"},
    },
)
def patch_bus(
    bus_id: int,
    req: BusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = BusService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(bus_id, data)
    logger.info(f"User {current_user.email} patched bus ID {bus_id}")
    return send_success(BusResponse.model_validate(record).model_dump())


@router.delete(
    "/{bus_id}",
    response_model=dict,
    summary="Delete a Bus",
    description="Soft-delete a bus node. The record is marked as deleted but retained in the database.",
    responses={200: {"description": "Bus deleted"}, 404: {"description": "Not found"}},
)
def delete_bus(
    bus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = BusService(db)
    service.delete(bus_id)
    logger.info(f"User {current_user.email} deleted bus ID {bus_id}")
    return send_success({"deleted": True, "id": bus_id})
