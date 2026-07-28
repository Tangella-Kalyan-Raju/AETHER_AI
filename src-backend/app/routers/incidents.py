from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.repositories.grid_repository import IncidentRepository
from app.schemas.grid_schemas import IncidentCreate, IncidentResponse
from app.core.security import PermissionGuard, get_current_user
from app.core.response import send_success
from app.models.auth_models import User

router = APIRouter()

@router.get("", response_model=dict)
def list_incidents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    repo = IncidentRepository(db)
    filters = {}
    if severity:
        filters["severity"] = severity
        
    result = repo.get_page(
        page=page,
        page_size=limit,
        filters=filters,
        search_query=search,
        search_columns=["title", "description", "severity"]
    )
    records = [IncidentResponse.model_validate(i) for i in result["items"]]
    meta = {
        "page": result["page"],
        "limit": result["page_size"],
        "totalCount": result["total_records"],
        "totalPages": result["total_pages"]
    }
    return send_success([r.model_dump() for r in records], meta=meta)

@router.get("/{incident_id}", response_model=dict)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    repo = IncidentRepository(db)
    incident = repo.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return send_success(IncidentResponse.model_validate(incident).model_dump())

@router.post("", response_model=dict)
def create_incident(
    req: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("grid:control"))
):
    repo = IncidentRepository(db)
    data = req.model_dump()
    data["status"] = "active"
    try:
        new_incident = repo.create(data)
        return send_success(IncidentResponse.model_validate(new_incident).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
