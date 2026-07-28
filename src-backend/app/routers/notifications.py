from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.repositories.system_repository import NotificationRepository
from app.schemas.system_schemas import NotificationResponse
from app.core.security import get_current_user
from app.core.response import send_success
from app.models.auth_models import User

router = APIRouter()

@router.get("", response_model=dict)
def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = NotificationRepository(db)
    result = repo.get_page(
        page=page,
        page_size=limit,
        filters={"user_id": current_user.id}
    )
    records = [NotificationResponse.model_validate(n) for n in result["items"]]
    meta = {
        "page": result["page"],
        "limit": result["page_size"],
        "totalCount": result["total_records"],
        "totalPages": result["total_pages"]
    }
    return send_success([r.model_dump() for r in records], meta=meta)

@router.get("/unread", response_model=dict)
def get_unread_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = NotificationRepository(db)
    notifications = repo.get_unread_by_user(current_user.id)
    records = [NotificationResponse.model_validate(n) for n in notifications]
    return send_success([r.model_dump() for r in records])

@router.put("/{notification_id}/read", response_model=dict)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = NotificationRepository(db)
    notification = repo.get(notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found.")
        
    updated = repo.update(notification_id, {"is_read": True})
    return send_success(NotificationResponse.model_validate(updated).model_dump())
