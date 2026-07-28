from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.repositories.system_repository import ReportRepository
from app.schemas.system_schemas import ReportCreate, ReportResponse
from app.core.security import PermissionGuard, get_current_user
from app.core.response import send_success
from app.models.auth_models import User

router = APIRouter()

@router.get("", response_model=dict)
def list_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("reports:view"))
):
    repo = ReportRepository(db)
    filters = {}
    if type:
        filters["type"] = type
        
    result = repo.get_page(
        page=page,
        page_size=limit,
        filters=filters
    )
    records = [ReportResponse.model_validate(r) for r in result["items"]]
    meta = {
        "page": result["page"],
        "limit": result["page_size"],
        "totalCount": result["total_records"],
        "totalPages": result["total_pages"]
    }
    return send_success([r.model_dump() for r in records], meta=meta)

@router.get("/{report_id}", response_model=dict)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("reports:view"))
):
    repo = ReportRepository(db)
    report = repo.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return send_success(ReportResponse.model_validate(report).model_dump())

@router.post("", response_model=dict)
def create_report(
    req: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("reports:create"))
):
    repo = ReportRepository(db)
    data = req.model_dump()
    data["created_by"] = current_user.id
    data["status"] = "active"
    try:
        new_report = repo.create(data)
        return send_success(ReportResponse.model_validate(new_report).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
