"""
Phase 3.2 — Switch / Breaker REST API Router
Full CRUD (GET, POST, PUT, PATCH, DELETE), UUID lookup, search, filtering
by state/status/line/bus, sorting, pagination, and date range filtering for Switches.
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
from app.services.digital_twin_service import SwitchService
from app.schemas.digital_twin_schemas import (
    SwitchCreate, SwitchUpdate, SwitchResponse, SortOrder
)

logger = logging.getLogger("gpo.api.switches")
router = APIRouter()


@router.get(
    "",
    response_model=dict,
    summary="List all Switches",
    description="Retrieve a paginated list of switches with optional search, filtering by state (open/closed), "
                "status, associated line, associated bus, date ranges, and sorting.",
    responses={200: {"description": "Paginated list of switches"}},
)
def list_switches(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Records per page"),
    search: Optional[str] = Query(None, description="Search by name, UUID, description, or state"),
    sort_by: Optional[str] = Query(None, description="Sort field (name, state, created_at, updated_at)"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort direction"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    state: Optional[str] = Query(None, description="Filter by switch state (open/closed)"),
    line_id: Optional[int] = Query(None, description="Filter by associated transmission line ID"),
    bus_id: Optional[int] = Query(None, description="Filter by associated bus ID"),
    created_after: Optional[datetime] = Query(None, description="Filter: created after this ISO timestamp"),
    created_before: Optional[datetime] = Query(None, description="Filter: created before this ISO timestamp"),
    updated_after: Optional[datetime] = Query(None, description="Filter: updated after this ISO timestamp"),
    updated_before: Optional[datetime] = Query(None, description="Filter: updated before this ISO timestamp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = SwitchService(db)
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if state:
        filters["state"] = state
    if line_id:
        filters["line_id"] = line_id
    if bus_id:
        filters["bus_id"] = bus_id
    result = service.list_paginated(
        page, limit, search, sort_by, sort_order.value, filters,
        created_after=created_after, created_before=created_before,
        updated_after=updated_after, updated_before=updated_before,
    )
    records = [SwitchResponse.model_validate(r).model_dump() for r in result["items"]]
    return send_success(records, meta=result["meta"])


@router.get(
    "/uuid/{uuid}",
    response_model=dict,
    summary="Get Switch by UUID",
    description="Retrieve a single switch by its universally unique identifier (UUID).",
    responses={200: {"description": "Switch details"}, 404: {"description": "Not found"}},
)
def get_switch_by_uuid(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = SwitchService(db)
    record = service.get_by_uuid(uuid)
    return send_success(SwitchResponse.model_validate(record).model_dump())


@router.get(
    "/{switch_id}",
    response_model=dict,
    summary="Get Switch by ID",
    description="Retrieve a single switch by its primary key ID.",
    responses={200: {"description": "Switch details"}, 404: {"description": "Not found"}},
)
def get_switch(
    switch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = SwitchService(db)
    record = service.get_by_id(switch_id)
    return send_success(SwitchResponse.model_validate(record).model_dump())


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Switch",
    description="Create a new switch/breaker. Validates line and bus references exist, and enforces name uniqueness.",
    responses={
        201: {"description": "Switch created"},
        400: {"description": "Invalid references (line_id or bus_id)"},
        409: {"description": "Duplicate name"},
        422: {"description": "Validation error"},
    },
)
def create_switch(
    req: SwitchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = SwitchService(db)
    data = req.model_dump()
    record = service.create(data)
    logger.info(f"User {current_user.email} created switch '{record.name}'")
    return send_success(SwitchResponse.model_validate(record).model_dump())


@router.put(
    "/{switch_id}",
    response_model=dict,
    summary="Update a Switch (Full)",
    description="Full update of an existing switch. Validates references and name uniqueness.",
    responses={
        200: {"description": "Switch updated"},
        404: {"description": "Not found"},
        400: {"description": "Invalid references"},
        409: {"description": "Duplicate name"},
    },
)
def update_switch(
    switch_id: int,
    req: SwitchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = SwitchService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(switch_id, data)
    logger.info(f"User {current_user.email} updated switch ID {switch_id}")
    return send_success(SwitchResponse.model_validate(record).model_dump())


@router.patch(
    "/{switch_id}",
    response_model=dict,
    summary="Partially Update a Switch",
    description="Partial update — only the provided fields are modified. Unspecified fields remain unchanged.",
    responses={
        200: {"description": "Switch partially updated"},
        404: {"description": "Not found"},
        409: {"description": "Duplicate name"},
    },
)
def patch_switch(
    switch_id: int,
    req: SwitchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = SwitchService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(switch_id, data)
    logger.info(f"User {current_user.email} patched switch ID {switch_id}")
    return send_success(SwitchResponse.model_validate(record).model_dump())


@router.delete(
    "/{switch_id}",
    response_model=dict,
    summary="Delete a Switch",
    description="Soft-delete a switch. The record is marked as deleted but retained.",
    responses={200: {"description": "Switch deleted"}, 404: {"description": "Not found"}},
)
def delete_switch(
    switch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = SwitchService(db)
    service.delete(switch_id)
    logger.info(f"User {current_user.email} deleted switch ID {switch_id}")
    return send_success({"deleted": True, "id": switch_id})
