from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.repositories.system_repository import SystemSettingRepository
from app.schemas.system_schemas import SystemSettingCreate, SystemSettingResponse
from app.core.security import PermissionGuard
from app.core.response import send_success
from app.models.auth_models import User

router = APIRouter()

@router.get("", response_model=dict)
def list_settings(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("settings:view"))
):
    repo = SystemSettingRepository(db)
    result = repo.get_page(page=page, page_size=limit)
    records = [SystemSettingResponse.model_validate(s) for s in result["items"]]
    meta = {
        "page": result["page"],
        "limit": result["page_size"],
        "totalCount": result["total_records"],
        "totalPages": result["total_pages"]
    }
    return send_success([r.model_dump() for r in records], meta=meta)

@router.get("/{key}", response_model=dict)
def get_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("settings:view"))
):
    repo = SystemSettingRepository(db)
    setting = repo.get(key)
    if not setting:
        raise HTTPException(status_code=404, detail=f"System setting '{key}' not found.")
    return send_success(SystemSettingResponse.model_validate(setting).model_dump())

@router.put("", response_model=dict)
def upsert_setting(
    req: SystemSettingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("admin:view"))
):
    repo = SystemSettingRepository(db)
    setting = repo.set_value(req.key, req.value, req.description)
    return send_success(SystemSettingResponse.model_validate(setting).model_dump())
