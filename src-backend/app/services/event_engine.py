import logging
import uuid
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.core.streaming import event_bus
from app.models.event_models import EngineeringRule, OperationalEvent
from app.services.alarm_service import AlarmService

logger = logging.getLogger("gpo.engine")

class EventEngine:
    def __init__(self):
        self._rules = []
        
    def refresh_rules(self):
        db = SessionLocal()
        try:
            self._rules = db.query(EngineeringRule).filter_by(is_active=True).all()
            logger.info(f"Loaded {len(self._rules)} engineering rules.")
        finally:
            db.close()

    def process_telemetry(self, telemetry: dict):
        """Callback for the event bus on 'global_telemetry'"""
        if not self._rules:
            self.refresh_rules()

        # Telemetry format from Phase 5.3:
        # { "asset_id": "sub_1", "type": "Substation", "timestamp": "...", "measurements": { "voltage_kv": 240.5 } }
        asset_id = telemetry.get("asset_id")
        asset_type = telemetry.get("type")
        measurements = telemetry.get("measurements", {})
        
        db = SessionLocal()
        try:
            for rule in self._rules:
                if rule.asset_type.lower() != asset_type.lower():
                    continue
                
                value = measurements.get(rule.measurement_type)
                if value is None:
                    continue
                
                triggered = False
                if rule.condition == ">" and value > rule.threshold_value:
                    triggered = True
                elif rule.condition == "<" and value < rule.threshold_value:
                    triggered = True
                elif rule.condition == "==" and value == rule.threshold_value:
                    triggered = True
                elif rule.condition == "!=" and value != rule.threshold_value:
                    triggered = True
                elif rule.condition == "OUT_OF_BOUNDS":
                    if rule.secondary_threshold is not None:
                        if value < rule.threshold_value or value > rule.secondary_threshold:
                            triggered = True

                if triggered:
                    # Create an Event
                    event = OperationalEvent(
                        event_type="RULE_VIOLATION",
                        event_category="Grid",
                        asset_id=asset_id,
                        region="Global", # Can be fetched from asset if needed
                        severity=rule.severity,
                        source="EventEngine",
                        description=rule.description or f"{rule.measurement_type} violated condition {rule.condition} {rule.threshold_value}. Current value: {value}",
                        metadata_json={"rule_id": str(rule.id), "value": value}
                    )
                    db.add(event)
                    db.commit()
                    db.refresh(event)
                    
                    # Raise an Alarm
                    AlarmService.raise_alarm(db, {
                        "alarm_type": rule.name,
                        "asset_id": asset_id,
                        "region": "Global",
                        "severity": rule.severity,
                        "description": event.description,
                        "trigger_event_id": event.id
                    })
                    
        except Exception as e:
            logger.error(f"Error processing telemetry for rule engine: {e}")
        finally:
            db.close()

    def start(self):
        event_bus.subscribe("global_telemetry", self.process_telemetry)
        logger.info("Event Engine started and subscribed to global_telemetry")

event_engine = EventEngine()
