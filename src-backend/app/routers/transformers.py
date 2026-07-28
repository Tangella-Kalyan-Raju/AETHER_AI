"""
Phase 3.2 — Transformer REST API Router
Full CRUD (GET, POST, PUT, PATCH, DELETE), UUID lookup, search, filtering
by status/rating range, sorting, pagination, and date range filtering for Transformers.
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
from app.services.digital_twin_service import TransformerService
from app.schemas.digital_twin_schemas import (
    TransformerCreate, TransformerUpdate, TransformerResponse, SortOrder
)

logger = logging.getLogger("gpo.api.transformers")
router = APIRouter()


@router.get(
    "",
    response_model=dict,
    summary="List all Transformers",
    description="Retrieve a paginated list of transformers with optional search, filtering by status, "
                "MVA rating range, date ranges, and sorting by name, rating_mva, created_at, or updated_at.",
    responses={200: {"description": "Paginated list of transformers"}},
)
def list_transformers(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Records per page"),
    search: Optional[str] = Query(None, description="Search by name, UUID, or description"),
    sort_by: Optional[str] = Query(None, description="Sort field (name, rating_mva, created_at, updated_at)"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort direction"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    min_rating: Optional[float] = Query(None, ge=0, description="Minimum rating in MVA"),
    max_rating: Optional[float] = Query(None, ge=0, description="Maximum rating in MVA"),
    created_after: Optional[datetime] = Query(None, description="Filter: created after this ISO timestamp"),
    created_before: Optional[datetime] = Query(None, description="Filter: created before this ISO timestamp"),
    updated_after: Optional[datetime] = Query(None, description="Filter: updated after this ISO timestamp"),
    updated_before: Optional[datetime] = Query(None, description="Filter: updated before this ISO timestamp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = TransformerService(db)
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    result = service.list_paginated(
        page, limit, search, sort_by, sort_order.value, filters,
        created_after=created_after, created_before=created_before,
        updated_after=updated_after, updated_before=updated_before,
        min_rating=min_rating, max_rating=max_rating,
    )
    records = [TransformerResponse.model_validate(r).model_dump() for r in result["items"]]
    return send_success(records, meta=result["meta"])


@router.get(
    "/uuid/{uuid}",
    response_model=dict,
    summary="Get Transformer by UUID",
    description="Retrieve a single transformer by its universally unique identifier (UUID).",
    responses={200: {"description": "Transformer details"}, 404: {"description": "Not found"}},
)
def get_transformer_by_uuid(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = TransformerService(db)
    record = service.get_by_uuid(uuid)
    return send_success(TransformerResponse.model_validate(record).model_dump())


@router.get(
    "/{transformer_id}",
    response_model=dict,
    summary="Get Transformer by ID",
    description="Retrieve a single transformer by its primary key ID.",
    responses={200: {"description": "Transformer details"}, 404: {"description": "Not found"}},
)
def get_transformer(
    transformer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view")),
):
    service = TransformerService(db)
    record = service.get_by_id(transformer_id)
    return send_success(TransformerResponse.model_validate(record).model_dump())


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Transformer",
    description="Create a new transformer connecting two bus nodes. from_bus_id and to_bus_id must be different "
                "(no self-loops) and both must reference existing buses.",
    responses={
        201: {"description": "Transformer created"},
        400: {"description": "Invalid bus references or self-loop"},
        409: {"description": "Duplicate name"},
        422: {"description": "Validation error"},
    },
)
def create_transformer(
    req: TransformerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = TransformerService(db)
    data = req.model_dump()
    record = service.create(data)
    logger.info(f"User {current_user.email} created transformer '{record.name}'")
    return send_success(TransformerResponse.model_validate(record).model_dump())


@router.put(
    "/{transformer_id}",
    response_model=dict,
    summary="Update a Transformer (Full)",
    description="Full update of an existing transformer. Validates bus references and name uniqueness.",
    responses={
        200: {"description": "Transformer updated"},
        404: {"description": "Not found"},
        400: {"description": "Invalid bus references"},
        409: {"description": "Duplicate name"},
    },
)
def update_transformer(
    transformer_id: int,
    req: TransformerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = TransformerService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(transformer_id, data)
    logger.info(f"User {current_user.email} updated transformer ID {transformer_id}")
    return send_success(TransformerResponse.model_validate(record).model_dump())


@router.patch(
    "/{transformer_id}",
    response_model=dict,
    summary="Partially Update a Transformer",
    description="Partial update — only the provided fields are modified. Unspecified fields remain unchanged.",
    responses={
        200: {"description": "Transformer partially updated"},
        404: {"description": "Not found"},
        409: {"description": "Duplicate name"},
    },
)
def patch_transformer(
    transformer_id: int,
    req: TransformerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = TransformerService(db)
    data = req.model_dump(exclude_unset=True)
    record = service.update(transformer_id, data)
    logger.info(f"User {current_user.email} patched transformer ID {transformer_id}")
    return send_success(TransformerResponse.model_validate(record).model_dump())


@router.delete(
    "/{transformer_id}",
    response_model=dict,
    summary="Delete a Transformer",
    description="Soft-delete a transformer. The record is marked as deleted but retained.",
    responses={200: {"description": "Transformer deleted"}, 404: {"description": "Not found"}},
)
def delete_transformer(
    transformer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage")),
):
    service = TransformerService(db)
    service.delete(transformer_id)
    logger.info(f"User {current_user.email} deleted transformer ID {transformer_id}")
    return send_success({"deleted": True, "id": transformer_id})
