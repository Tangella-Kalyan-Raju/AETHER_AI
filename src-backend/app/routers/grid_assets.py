from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.repositories.grid_repository import GridAssetRepository
from app.schemas.grid_schemas import GridAssetCreate, GridAssetUpdate, GridAssetResponse
from app.core.security import PermissionGuard, get_current_user
from app.core.response import send_success
from app.models.auth_models import User

router = APIRouter()

@router.get("", response_model=dict)
def list_assets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    repo = GridAssetRepository(db)
    filters = {}
    if type:
        filters["type"] = type
        
    result = repo.get_page(
        page=page,
        page_size=limit,
        filters=filters,
        search_query=search,
        search_columns=["name", "type"]
    )
    records = [GridAssetResponse.model_validate(r) for r in result["items"]]
    meta = {
        "page": result["page"],
        "limit": result["page_size"],
        "totalCount": result["total_records"],
        "totalPages": result["total_pages"]
    }
    return send_success([r.model_dump() for r in records], meta=meta)

@router.get("/{asset_id}", response_model=dict)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    repo = GridAssetRepository(db)
    asset = repo.get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Grid asset not found.")
    return send_success(GridAssetResponse.model_validate(asset).model_dump())

@router.post("", response_model=dict)
def create_asset(
    req: GridAssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage"))
):
    repo = GridAssetRepository(db)
    data = req.model_dump()
    data["created_by"] = current_user.id
    data["status"] = "active"
    try:
        new_asset = repo.create(data)
        return send_success(GridAssetResponse.model_validate(new_asset).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{asset_id}", response_model=dict)
def update_asset(
    asset_id: int,
    req: GridAssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage"))
):
    repo = GridAssetRepository(db)
    data = req.model_dump(exclude_unset=True)
    try:
        updated = repo.update(asset_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Grid asset not found.")
        return send_success(GridAssetResponse.model_validate(updated).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{asset_id}", response_model=dict)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("assets:manage"))
):
    repo = GridAssetRepository(db)
    success = repo.delete(asset_id, soft=True)
    return send_success({"success": success})
