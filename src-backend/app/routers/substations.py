"""
Phase 3.2 — Substation REST API Router
Full CRUD (GET, POST, PUT, PATCH, DELETE), UUID lookup, search, filtering,
sorting, pagination, and advanced date range filtering for Substations.
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
from app.services.digital_twin_service import SubstationService
from app.schemas.digital_twin_schemas import (
    SubstationCreate, SubstationUpdate, SubstationResponse, SortOrder
)

logger = logging.getLogger("gpo.api.substations")
router = APIRouter()


@router.get(
    "",
    response_model=dict,
    summary="List all Substations",
    description="Retrieve a paginated list of substations with optional search, filtering by status, "
                "date range filtering, and sorting. Supports ascending and descending sort on name, "
                "created_at, and updated_at columns.",
    responses={
        200: {"description": "Paginated list of substations with metadata"},
        401: {"description": "Authentication required"},
        403: {"description": "Insufficient permissions"},
    },
)
def list_substations(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Records per page (max 100)"),
    search: Optional[str] = Query(None, description="Search by name, UUID, or description"),
    sort_by: Optional[str] = Query(None, description="Sort field (name, created_at, updated_at)"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort direction"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (active, inactive, maintenance)"),
    created_after: Optional[datetime] = Query(None, description="Filter: created after this ISO timestamp"),
    created_before: Optional[datetime] = Query(None, description="Filter: created before this ISO timestamp"),
    updated_after: Optional[datetime] = Query(None, description="Filter: updated after this ISO timestamp"),
    updated_before: Optional[datetime] = Query(None, description="Filter: updated before this ISO timestamp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = SubstationService(db)
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    result = service.list_paginated(
        page, limit, search, sort_by, sort_order.value, filters,
        created_after=created_after, created_before=created_before,
        updated_after=updated_after, updated_before=updated_before,
    )
    records = [SubstationResponse.model_validate(r).model_dump() for r in result["items"]]
    return send_success(records, meta=result["meta"])


@router.get(
    "/uuid/{uuid}",
    response_model=dict,
    summary="Get Substation by UUID",
    description="Retrieve a single substation by its universally unique identifier (UUID).",
    responses={200: {"description": "Substation details"}, 404: {"description": "Substation not found"}},
)
def get_substation_by_uuid(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = SubstationService(db)
    record = service.get_by_uuid(uuid)
    return send_success(SubstationResponse.model_validate(record).model_dump())


@router.get(
    "/{substation_id}",
    response_model=dict,
    summary="Get Substation by ID",
    description="Retrieve a single substation by its primary key ID.",
    responses={200: {"description": "Substation details"}, 404: {"description": "Substation not found"}},
)
def get_substation(
    substation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = SubstationService(db)
    record = service.get_by_id(substation_id)
    return send_success(SubstationResponse.model_validate(record).model_dump())


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Substation",
    description="Create a new substation in the Digital Twin grid model. Name must be unique across all substations.",
    responses={
        201: {"description": "Substation created successfully"},
        409: {"description": "A substation with this name already exists"},
        422: {"description": "Request validation failed"},
    },
)
def create_substation(
    req: SubstationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = SubstationService(db)
    data = req.model_dump()
    record = service.create(data)
    logger.info(f"User {current_user.email} created substation '{record.name}'")
    return send_success(SubstationResponse.model_validate(record).model_dump())


@router.put(
    "/{substation_id}",
    response_model=dict,
    summary="Update a Substation (Full)",
    description="Full update of an existing substation. All provided fields are applied. "
                "Validates name uniqueness if name is being changed.",
    responses={
        200: {"description": "Substation updated"},
        404: {"description": "Substation not found"},
        409: {"description": "Duplicate name conflict"},
    },
)
def update_substation(
    substation_id: int,
    req: SubstationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = SubstationService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(substation_id, data)
    logger.info(f"User {current_user.email} updated substation ID {substation_id}")
    return send_success(SubstationResponse.model_validate(record).model_dump())


@router.patch(
    "/{substation_id}",
    response_model=dict,
    summary="Partially Update a Substation",
    description="Partial update — only the provided fields are modified. Unspecified fields remain unchanged.",
    responses={
        200: {"description": "Substation partially updated"},
        404: {"description": "Substation not found"},
        409: {"description": "Duplicate name conflict"},
    },
)
def patch_substation(
    substation_id: int,
    req: SubstationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = SubstationService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(substation_id, data)
    logger.info(f"User {current_user.email} patched substation ID {substation_id}")
    return send_success(SubstationResponse.model_validate(record).model_dump())


@router.delete(
    "/{substation_id}",
    response_model=dict,
    summary="Delete a Substation",
    description="Soft-delete a substation. The record is marked as deleted but retained in the database for audit trail.",
    responses={200: {"description": "Substation soft-deleted"}, 404: {"description": "Substation not found"}},
)
def delete_substation(
    substation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = SubstationService(db)
    service.delete(substation_id)
    logger.info(f"User {current_user.email} deleted substation ID {substation_id}")
    return send_success({"deleted": True, "id": substation_id})
