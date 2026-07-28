import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.event_models import OperationalAlarm
from app.models.system_models import AuditLog

class AlarmService:
    @staticmethod
    def raise_alarm(db: Session, alarm_data: dict) -> OperationalAlarm:
        alarm = OperationalAlarm(**alarm_data)
        db.add(alarm)
        db.commit()
        db.refresh(alarm)
        
        # Audit
        audit = AuditLog(
            action="alarm.raised",
            details=f"Alarm {alarm.id} raised: {alarm.alarm_type} for {alarm.asset_id}",
            status="success"
        )
        db.add(audit)
        db.commit()
        return alarm

    @staticmethod
    def acknowledge_alarm(db: Session, alarm_id: uuid.UUID, user_id: int) -> Optional[OperationalAlarm]:
        alarm = db.query(OperationalAlarm).filter_by(id=alarm_id).first()
        if not alarm or alarm.status != "Raised":
            return None
            
        alarm.status = "Acknowledged"
        alarm.acknowledged_at = datetime.now(timezone.utc)
        alarm.assigned_to = user_id
        
        audit = AuditLog(
            user_id=user_id,
            action="alarm.acknowledged",
            details=f"Alarm {alarm.id} acknowledged",
            status="success"
        )
        db.add(audit)
        db.commit()
        db.refresh(alarm)
        return alarm

    @staticmethod
    def resolve_alarm(db: Session, alarm_id: uuid.UUID, user_id: int, notes: str = None) -> Optional[OperationalAlarm]:
        alarm = db.query(OperationalAlarm).filter_by(id=alarm_id).first()
        if not alarm:
            return None
            
        alarm.status = "Resolved"
        alarm.resolved_at = datetime.now(timezone.utc)
        if notes:
            alarm.notes = notes
            
        audit = AuditLog(
            user_id=user_id,
            action="alarm.resolved",
            details=f"Alarm {alarm.id} resolved",
            status="success"
        )
        db.add(audit)
        db.commit()
        db.refresh(alarm)
        return alarm

    @staticmethod
    def close_alarm(db: Session, alarm_id: uuid.UUID, user_id: int) -> Optional[OperationalAlarm]:
        alarm = db.query(OperationalAlarm).filter_by(id=alarm_id).first()
        if not alarm:
            return None
            
        alarm.status = "Closed"
        alarm.closed_at = datetime.now(timezone.utc)
            
        audit = AuditLog(
            user_id=user_id,
            action="alarm.closed",
            details=f"Alarm {alarm.id} closed",
            status="success"
        )
        db.add(audit)
        db.commit()
        db.refresh(alarm)
        return alarm
