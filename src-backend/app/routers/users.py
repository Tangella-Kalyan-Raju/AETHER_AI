from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schemas import UserResponse
from app.core.security import PermissionGuard, get_current_user
from app.core.response import send_success
from app.models.auth_models import User

router = APIRouter()

@router.get("", response_model=dict)
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("admin:view"))
):
    repo = UserRepository(db)
    result = repo.get_page(
        page=page,
        page_size=limit,
        search_query=search,
        search_columns=["email", "full_name", "organization", "role"]
    )
    records = [UserResponse.model_validate(r) for r in result["items"]]
    meta = {
        "page": result["page"],
        "limit": result["page_size"],
        "totalCount": result["total"],
        "totalPages": result["total_pages"]
    }
    return send_success([r.model_dump() for r in records], meta=meta)

@router.get("/{user_id}", response_model=dict)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("admin:view"))
):
    repo = UserRepository(db)
    user = repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return send_success(UserResponse.model_validate(user).model_dump())

@router.put("/{user_id}", response_model=dict)
def update_user_profile(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Operators can update their own profiles; admins can update anyone
    if current_user.id != user_id and current_user.role != "Super Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have clearance to modify this user account."
        )
    
    repo = UserRepository(db)
    # Exclude sensitive updates like password or role from direct update dict
    update_data = {k: v for k, v in data.items() if k in ["full_name", "organization"]}
    updated_user = repo.update(user_id, update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User profile not found to update.")
    return send_success(UserResponse.model_validate(updated_user).model_dump())

@router.delete("/{user_id}", response_model=dict)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("admin:view"))
):
    repo = UserRepository(db)
    success = repo.delete(user_id, soft=True)
    return send_success({"success": success})
