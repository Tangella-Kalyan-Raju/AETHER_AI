"""
Phase 3.2 — Load REST API Router
Full CRUD (GET, POST, PUT, PATCH, DELETE), UUID lookup, search, filtering
by bus/status/power range, sorting, pagination, and date range filtering for Loads.
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
from app.services.digital_twin_service import LoadService
from app.schemas.digital_twin_schemas import (
    LoadCreate, LoadUpdate, LoadResponse, SortOrder
)

logger = logging.getLogger("gpo.api.loads")
router = APIRouter()


@router.get(
    "",
    response_model=dict,
    summary="List all Loads",
    description="Retrieve a paginated list of loads with optional search, filtering by bus, status, "
                "active power range (MW), date ranges, and sorting by name, p_mw, created_at, or updated_at.",
    responses={200: {"description": "Paginated list of loads"}},
)
def list_loads(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Records per page"),
    search: Optional[str] = Query(None, description="Search by name, UUID, or description"),
    sort_by: Optional[str] = Query(None, description="Sort field (name, p_mw, created_at, updated_at)"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort direction"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    bus_id: Optional[int] = Query(None, description="Filter by parent bus ID"),
    min_power: Optional[float] = Query(None, ge=0, description="Minimum active power demand in MW"),
    max_power: Optional[float] = Query(None, ge=0, description="Maximum active power demand in MW"),
    created_after: Optional[datetime] = Query(None, description="Filter: created after this ISO timestamp"),
    created_before: Optional[datetime] = Query(None, description="Filter: created before this ISO timestamp"),
    updated_after: Optional[datetime] = Query(None, description="Filter: updated after this ISO timestamp"),
    updated_before: Optional[datetime] = Query(None, description="Filter: updated before this ISO timestamp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = LoadService(db)
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if bus_id:
        filters["bus_id"] = bus_id
    result = service.list_paginated(
        page, limit, search, sort_by, sort_order.value, filters,
        created_after=created_after, created_before=created_before,
        updated_after=updated_after, updated_before=updated_before,
        min_power=min_power, max_power=max_power,
    )
    records = [LoadResponse.model_validate(r).model_dump() for r in result["items"]]
    return send_success(records, meta=result["meta"])


@router.get(
    "/uuid/{uuid}",
    response_model=dict,
    summary="Get Load by UUID",
    description="Retrieve a single load by its universally unique identifier (UUID).",
    responses={200: {"description": "Load details"}, 404: {"description": "Not found"}},
)
def get_load_by_uuid(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = LoadService(db)
    record = service.get_by_uuid(uuid)
    return send_success(LoadResponse.model_validate(record).model_dump())


@router.get(
    "/{load_id}",
    response_model=dict,
    summary="Get Load by ID",
    description="Retrieve a single load by its primary key ID.",
    responses={200: {"description": "Load details"}, 404: {"description": "Not found"}},
)
def get_load(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = LoadService(db)
    record = service.get_by_id(load_id)
    return send_success(LoadResponse.model_validate(record).model_dump())


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Load",
    description="Create a new load connected to a bus. Validates bus reference exists and name uniqueness.",
    responses={
        201: {"description": "Load created"},
        400: {"description": "Invalid bus reference"},
        409: {"description": "Duplicate name"},
        422: {"description": "Validation error"},
    },
)
def create_load(
    req: LoadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = LoadService(db)
    data = req.model_dump()
    record = service.create(data)
    logger.info(f"User {current_user.email} created load '{record.name}'")
    return send_success(LoadResponse.model_validate(record).model_dump())


@router.put(
    "/{load_id}",
    response_model=dict,
    summary="Update a Load (Full)",
    description="Full update of an existing load. Validates bus reference and name uniqueness if changed.",
    responses={
        200: {"description": "Load updated"},
        404: {"description": "Not found"},
        409: {"description": "Duplicate name"},
    },
)
def update_load(
    load_id: int,
    req: LoadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = LoadService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(load_id, data)
    logger.info(f"User {current_user.email} updated load ID {load_id}")
    return send_success(LoadResponse.model_validate(record).model_dump())


@router.patch(
    "/{load_id}",
    response_model=dict,
    summary="Partially Update a Load",
    description="Partial update — only the provided fields are modified. Unspecified fields remain unchanged.",
    responses={
        200: {"description": "Load partially updated"},
        404: {"description": "Not found"},
        409: {"description": "Duplicate name"},
    },
)
def patch_load(
    load_id: int,
    req: LoadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = LoadService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(load_id, data)
    logger.info(f"User {current_user.email} patched load ID {load_id}")
    return send_success(LoadResponse.model_validate(record).model_dump())


@router.delete(
    "/{load_id}",
    response_model=dict,
    summary="Delete a Load",
    description="Soft-delete a load. The record is marked as deleted but retained.",
    responses={200: {"description": "Load deleted"}, 404: {"description": "Not found"}},
)
def delete_load(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = LoadService(db)
    service.delete(load_id)
    logger.info(f"User {current_user.email} deleted load ID {load_id}")
    return send_success({"deleted": True, "id": load_id})
