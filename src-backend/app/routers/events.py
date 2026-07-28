from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.core.security import PermissionGuard, get_current_user
from app.models.auth_models import User
from app.models.event_models import OperationalEvent, EngineeringRule
from app.schemas.event_schemas import OperationalEventResponse, EngineeringRuleResponse, EngineeringRuleCreate

router = APIRouter(tags=["Events"])

@router.get("", response_model=List[OperationalEventResponse])
def get_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("operations:view"))
):
    events = db.query(OperationalEvent).order_by(OperationalEvent.timestamp.desc()).limit(100).all()
    return events

@router.get("/rules", response_model=List[EngineeringRuleResponse])
def get_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("operations:view"))
):
    return db.query(EngineeringRule).all()

@router.post("/rules", response_model=EngineeringRuleResponse)
def create_rule(
    rule_in: EngineeringRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("operations:manage"))
):
    rule = EngineeringRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule
