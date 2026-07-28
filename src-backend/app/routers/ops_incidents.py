from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.connection import get_db
from app.core.security import PermissionGuard, get_current_user
from app.models.auth_models import User
from app.models.event_models import OperationalIncident
from app.schemas.event_schemas import OperationalIncidentCreate, OperationalIncidentResponse
from app.services.incident_service import IncidentService

router = APIRouter(tags=["Operational Incidents"])

@router.get("", response_model=List[OperationalIncidentResponse])
def get_ops_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("operations:view"))
):
    incidents = db.query(OperationalIncident).all()
    return incidents

@router.post("", response_model=OperationalIncidentResponse)
def create_ops_incident(
    incident_in: OperationalIncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("operations:manage"))
):
    incident = IncidentService.create_incident(db, incident_in, current_user.id)
    return incident

@router.patch("/{incident_id}/status", response_model=OperationalIncidentResponse)
def update_ops_incident_status(
    incident_id: uuid.UUID,
    status: str = Query(...),
    notes: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("operations:manage"))
):
    incident = IncidentService.update_incident_status(db, incident_id, status, current_user.id, notes)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident
