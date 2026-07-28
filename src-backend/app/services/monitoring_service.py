import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.repositories.monitoring_repository import MonitoringRepository
from app.schemas.monitoring_schemas import MeasurementCreate, QualityFlag, AssetStatus
from app.core.streaming import event_bus

logger = logging.getLogger("gpo.services.monitoring")

class MonitoringService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MonitoringRepository(db)

    def _validate_and_assign_quality(self, measurement: MeasurementCreate) -> Tuple[Dict[str, Any], bool]:
        """
        Data Validation & Quality Engine.
        Returns a tuple of (processed_data_dict, is_valid).
        """
        data = measurement.model_dump()
        
        # Base assumptions
        data["quality"] = QualityFlag.GOOD.value
        data["confidence"] = 100.0
        data["status"] = AssetStatus.HEALTHY.value
        is_valid = True

        # Check for future timestamps
        from datetime import timezone
        if data["timestamp"].timestamp() > datetime.now(timezone.utc).timestamp() + 5:  # 5s leeway
            data["quality"] = QualityFlag.INVALID.value
            data["confidence"] = 0.0
            is_valid = False
            return data, is_valid

        # Basic anomaly bounds (rule-based)
        if data["measurement_type"] == "voltage":
            # Just an example rule: if voltage is severely off nominal, lower confidence
            if data["value"] <= 0:
                data["quality"] = QualityFlag.BAD.value
                data["confidence"] = 10.0
                data["status"] = AssetStatus.CRITICAL.value
        elif data["measurement_type"] == "power":
            if data["value"] > 5000: # Example extremely high MW
                data["quality"] = QualityFlag.UNCERTAIN.value
                data["confidence"] = 50.0
                data["status"] = AssetStatus.WARNING.value

        # Status computation based on quality
        if data["quality"] == QualityFlag.BAD.value:
            data["status"] = AssetStatus.CRITICAL.value
            
        return data, is_valid

    async def ingest_measurements(self, measurements: List[MeasurementCreate]) -> Dict[str, Any]:
        """
        Live Data Service: Validates, saves to DB, and publishes to Event Streaming.
        """
        valid_records = []
        invalid_count = 0
        
        for m in measurements:
            processed_data, is_valid = self._validate_and_assign_quality(m)
            if is_valid:
                valid_records.append(processed_data)
            else:
                invalid_count += 1
                logger.warning(f"Invalid measurement rejected for asset {m.asset_id}")

        if valid_records:
            # Save to Database (Latest and History)
            try:
                self.repo.upsert_latest(valid_records)
                self.repo.insert_history(valid_records)
                self.db.commit()
                
                # Publish to Streaming Engine
                for record in valid_records:
                    await event_bus.publish(f"measurement.{record['asset_type']}.{record['asset_id']}", record)
                    await event_bus.publish("global_telemetry", record)
            except Exception as e:
                self.db.rollback()
                logger.error(f"Database error during telemetry ingestion: {e}")
                raise HTTPException(status_code=500, detail="Failed to save telemetry data.")
                
        return {
            "processed": len(measurements),
            "accepted": len(valid_records),
            "rejected": invalid_count
        }

    def get_latest_measurements(self, asset_id: str = None, measurement_type: str = None):
        return self.repo.get_latest_measurements(asset_id, measurement_type)

    def get_historical_measurements(
        self, page: int, page_size: int, asset_id: str, measurement_type: str, start_time: datetime, end_time: datetime
    ):
        return self.repo.get_historical_page(
            page=page, page_size=page_size, asset_id=asset_id,
            measurement_type=measurement_type, start_time=start_time, end_time=end_time
        )
