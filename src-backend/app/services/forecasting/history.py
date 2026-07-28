from sqlalchemy.orm import Session
from app.models.forecast_models import ForecastHistory, ForecastMetadata
from typing import List
import logging

logger = logging.getLogger("gpo.forecasting.history")

class ForecastRepository:
    def __init__(self):
        pass

    def get_history(self, db: Session, forecast_id: str = None) -> List[ForecastHistory]:
        query = db.query(ForecastHistory)
        if forecast_id:
            query = query.filter(ForecastHistory.forecast_id == forecast_id)
        return query.order_by(ForecastHistory.execution_timestamp.desc()).all()

    def get_metadata(self, db: Session, forecast_id: str) -> ForecastMetadata:
        return db.query(ForecastMetadata).filter(ForecastMetadata.forecast_id == forecast_id).first()

    def save_metadata(self, db: Session, metadata: ForecastMetadata) -> ForecastMetadata:
        db.add(metadata)
        db.commit()
        db.refresh(metadata)
        return metadata

forecast_repository = ForecastRepository()
