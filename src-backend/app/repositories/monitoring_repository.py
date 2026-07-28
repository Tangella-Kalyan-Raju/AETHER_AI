from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, update, insert
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.repositories.base_repository import BaseRepository
from app.models.monitoring_models import MeasurementLatest, MeasurementHistory

class MonitoringRepository:
    """Repository handling both Latest cache and Historical time-series telemetry."""
    
    def __init__(self, db: Session):
        self.db = db
        self.latest_repo = BaseRepository(db, MeasurementLatest)
        self.history_repo = BaseRepository(db, MeasurementHistory)

    def upsert_latest(self, data: List[Dict[str, Any]]) -> None:
        """
        Upserts the latest measurements into the cache table.
        Using PostgreSQL native upsert (ON CONFLICT) if possible, or standard fallback.
        Since we might use sqlite in tests, we'll implement a cross-compatible fallback or use SQLAlchemy 2.0 standard inserts.
        """
        for item in data:
            # Simple fallback for cross-dialect upsert
            existing = self.db.query(MeasurementLatest).filter_by(
                asset_id=item["asset_id"],
                measurement_type=item["measurement_type"]
            ).first()
            if existing:
                for key, value in item.items():
                    setattr(existing, key, value)
            else:
                new_record = MeasurementLatest(**item)
                self.db.add(new_record)
        self.db.flush()

    def insert_history(self, data: List[Dict[str, Any]]) -> None:
        """Bulk inserts into the history table."""
        self.db.execute(insert(MeasurementHistory), data)
        self.db.flush()

    def get_latest_measurements(
        self, asset_id: Optional[str] = None, measurement_type: Optional[str] = None
    ) -> List[MeasurementLatest]:
        """Fetch the most recent measurements, optionally filtered."""
        query = self.db.query(MeasurementLatest)
        if asset_id:
            query = query.filter_by(asset_id=asset_id)
        if measurement_type:
            query = query.filter_by(measurement_type=measurement_type)
        return query.all()

    def get_historical_page(
        self,
        page: int = 1,
        page_size: int = 50,
        asset_id: Optional[str] = None,
        measurement_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Fetch a paginated block of historical telemetry data."""
        filters = {}
        if asset_id:
            filters["asset_id"] = asset_id
        if measurement_type:
            filters["measurement_type"] = measurement_type
            
        range_filters = {}
        if start_time or end_time:
            range_filters["timestamp"] = (start_time, end_time)
            
        return self.history_repo.get_page(
            page=page,
            page_size=page_size,
            filters=filters,
            range_filters=range_filters,
            sort_by="timestamp",
            sort_order="desc"
        )
