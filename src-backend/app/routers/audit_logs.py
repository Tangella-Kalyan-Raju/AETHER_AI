from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.repositories.system_repository import AuditLogRepository
from app.schemas.system_schemas import AuditLogResponse
from app.core.security import PermissionGuard
from app.core.response import send_success
from app.models.auth_models import User

router = APIRouter()

@router.get("", response_model=dict)
def list_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("admin:view"))
):
    repo = AuditLogRepository(db)
    filters = {}
    if action:
        filters["action"] = action
    if user_id:
        filters["user_id"] = user_id
        
    result = repo.get_page(
        page=page,
        page_size=limit,
        filters=filters
    )
    records = [AuditLogResponse.model_validate(log) for log in result["items"]]
    meta = {
        "page": result["page"],
        "limit": result["page_size"],
        "totalCount": result["total_records"],
        "totalPages": result["total_pages"]
    }
    return send_success([r.model_dump() for r in records], meta=meta)
