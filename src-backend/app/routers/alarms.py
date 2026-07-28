from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.connection import get_db
from app.core.security import PermissionGuard, get_current_user
from app.models.auth_models import User
from app.models.event_models import OperationalAlarm
from app.schemas.event_schemas import OperationalAlarmResponse
from app.services.alarm_service import AlarmService

router = APIRouter(tags=["Alarms"])

@router.get("/active", response_model=List[OperationalAlarmResponse])
def get_active_alarms(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("operations:view"))
):
    alarms = db.query(OperationalAlarm).filter(OperationalAlarm.status.in_(["Raised", "Acknowledged", "Assigned", "In Progress"])).all()
    return alarms

@router.post("/{alarm_id}/acknowledge", response_model=OperationalAlarmResponse)
def acknowledge_alarm(
    alarm_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("operations:manage"))
):
    alarm = AlarmService.acknowledge_alarm(db, alarm_id, current_user.id)
    if not alarm:
        raise HTTPException(status_code=400, detail="Alarm not found or not in Raised state")
    return alarm

@router.post("/{alarm_id}/resolve", response_model=OperationalAlarmResponse)
def resolve_alarm(
    alarm_id: uuid.UUID,
    notes: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("operations:manage"))
):
    alarm = AlarmService.resolve_alarm(db, alarm_id, current_user.id, notes)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return alarm
