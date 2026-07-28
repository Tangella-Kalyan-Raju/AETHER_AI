"""
Phase 3.2 — Generator REST API Router
Full CRUD (GET, POST, PUT, PATCH, DELETE), UUID lookup, search, filtering
by type/status/bus/capacity range, sorting, pagination, and date range filtering for Generators.
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
from app.services.digital_twin_service import GeneratorService
from app.schemas.digital_twin_schemas import (
    GeneratorCreate, GeneratorUpdate, GeneratorResponse, SortOrder
)

logger = logging.getLogger("gpo.api.generators")
router = APIRouter()


@router.get(
    "",
    response_model=dict,
    summary="List all Generators",
    description="Retrieve a paginated list of generators with optional search, filtering by type, status, bus, "
                "capacity range (MW), date ranges, and sorting by name, capacity_mw, p_mw, created_at, or updated_at.",
    responses={200: {"description": "Paginated list of generators"}},
)
def list_generators(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Records per page"),
    search: Optional[str] = Query(None, description="Search by name, UUID, description, or type"),
    sort_by: Optional[str] = Query(None, description="Sort field (name, capacity_mw, p_mw, created_at, updated_at)"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort direction"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    bus_id: Optional[int] = Query(None, description="Filter by parent bus ID"),
    gen_type: Optional[str] = Query(None, alias="type", description="Filter by generator type (thermal, solar, wind, hydro, gas, nuclear)"),
    min_capacity: Optional[float] = Query(None, ge=0, description="Minimum capacity in MW"),
    max_capacity: Optional[float] = Query(None, ge=0, description="Maximum capacity in MW"),
    created_after: Optional[datetime] = Query(None, description="Filter: created after this ISO timestamp"),
    created_before: Optional[datetime] = Query(None, description="Filter: created before this ISO timestamp"),
    updated_after: Optional[datetime] = Query(None, description="Filter: updated after this ISO timestamp"),
    updated_before: Optional[datetime] = Query(None, description="Filter: updated before this ISO timestamp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = GeneratorService(db)
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if bus_id:
        filters["bus_id"] = bus_id
    if gen_type:
        filters["type"] = gen_type
    result = service.list_paginated(
        page, limit, search, sort_by, sort_order.value, filters,
        created_after=created_after, created_before=created_before,
        updated_after=updated_after, updated_before=updated_before,
        min_capacity=min_capacity, max_capacity=max_capacity,
    )
    records = [GeneratorResponse.model_validate(r).model_dump() for r in result["items"]]
    return send_success(records, meta=result["meta"])


@router.get(
    "/uuid/{uuid}",
    response_model=dict,
    summary="Get Generator by UUID",
    description="Retrieve a single generator by its universally unique identifier (UUID).",
    responses={200: {"description": "Generator details"}, 404: {"description": "Not found"}},
)
def get_generator_by_uuid(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = GeneratorService(db)
    record = service.get_by_uuid(uuid)
    return send_success(GeneratorResponse.model_validate(record).model_dump())


@router.get(
    "/{generator_id}",
    response_model=dict,
    summary="Get Generator by ID",
    description="Retrieve a single generator by its primary key ID.",
    responses={200: {"description": "Generator details"}, 404: {"description": "Not found"}},
)
def get_generator(
    generator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = GeneratorService(db)
    record = service.get_by_id(generator_id)
    return send_success(GeneratorResponse.model_validate(record).model_dump())


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Generator",
    description="Create a new generator connected to a bus. Validates bus exists, capacity bounds (p_mw <= capacity_mw), "
                "and name uniqueness.",
    responses={
        201: {"description": "Generator created"},
        400: {"description": "Invalid bus or capacity violation"},
        409: {"description": "Duplicate name"},
        422: {"description": "Validation error"},
    },
)
def create_generator(
    req: GeneratorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = GeneratorService(db)
    data = req.model_dump()
    record = service.create(data)
    logger.info(f"User {current_user.email} created generator '{record.name}'")
    return send_success(GeneratorResponse.model_validate(record).model_dump())


@router.put(
    "/{generator_id}",
    response_model=dict,
    summary="Update a Generator (Full)",
    description="Full update of an existing generator. Cross-validates p_mw against capacity_mw.",
    responses={
        200: {"description": "Generator updated"},
        404: {"description": "Not found"},
        400: {"description": "Validation error (capacity, bus)"},
        409: {"description": "Duplicate name"},
    },
)
def update_generator(
    generator_id: int,
    req: GeneratorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = GeneratorService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(generator_id, data)
    logger.info(f"User {current_user.email} updated generator ID {generator_id}")
    return send_success(GeneratorResponse.model_validate(record).model_dump())


@router.patch(
    "/{generator_id}",
    response_model=dict,
    summary="Partially Update a Generator",
    description="Partial update — only the provided fields are modified. Cross-validates p_mw against capacity_mw "
                "using the merged state of existing + provided values.",
    responses={
        200: {"description": "Generator partially updated"},
        404: {"description": "Not found"},
        400: {"description": "Validation error"},
    },
)
def patch_generator(
    generator_id: int,
    req: GeneratorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = GeneratorService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(generator_id, data)
    logger.info(f"User {current_user.email} patched generator ID {generator_id}")
    return send_success(GeneratorResponse.model_validate(record).model_dump())


@router.delete(
    "/{generator_id}",
    response_model=dict,
    summary="Delete a Generator",
    description="Soft-delete a generator. The record is marked as deleted but retained.",
    responses={200: {"description": "Generator deleted"}, 404: {"description": "Not found"}},
)
def delete_generator(
    generator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = GeneratorService(db)
    service.delete(generator_id)
    logger.info(f"User {current_user.email} deleted generator ID {generator_id}")
    return send_success({"deleted": True, "id": generator_id})
