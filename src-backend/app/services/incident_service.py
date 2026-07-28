import uuid
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.event_models import OperationalIncident, OperationalAlarm
from app.models.system_models import AuditLog
from app.schemas.event_schemas import OperationalIncidentCreate

class IncidentService:
    @staticmethod
    def create_incident(db: Session, incident_data: OperationalIncidentCreate, user_id: int) -> OperationalIncident:
        incident = OperationalIncident(
            title=incident_data.title,
            description=incident_data.description,
            severity=incident_data.severity,
            priority=incident_data.priority,
            asset_id=incident_data.asset_id,
            region=incident_data.region,
            assigned_to=user_id
        )
        db.add(incident)
        db.flush()
        
        # Link alarms if provided
        if incident_data.alarm_ids:
            alarms = db.query(OperationalAlarm).filter(OperationalAlarm.id.in_(incident_data.alarm_ids)).all()
            for alarm in alarms:
                alarm.incident_id = incident.id
        
        audit = AuditLog(
            user_id=user_id,
            action="incident.created",
            details=f"Incident {incident.id} created",
            status="success"
        )
        db.add(audit)
        db.commit()
        db.refresh(incident)
        return incident

    @staticmethod
    def update_incident_status(db: Session, incident_id: uuid.UUID, status: str, user_id: int, notes: str = None) -> Optional[OperationalIncident]:
        incident = db.query(OperationalIncident).filter_by(id=incident_id).first()
        if not incident:
            return None
            
        incident.status = status
        if status == "Closed":
            incident.closed_at = datetime.now(timezone.utc)
            
        if notes:
            incident.resolution_notes = notes
            
        audit = AuditLog(
            user_id=user_id,
            action=f"incident.status_changed",
            details=f"Incident {incident.id} status changed to {status}",
            status="success"
        )
        db.add(audit)
        db.commit()
        db.refresh(incident)
        return incident
