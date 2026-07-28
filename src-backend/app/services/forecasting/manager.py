from sqlalchemy.orm import Session
from app.models.forecast_models import Forecast, ForecastHistory
from app.schemas.forecast_schemas import ForecastCreate, ForecastRunRequest
import logging
from datetime import datetime, timezone

logger = logging.getLogger("gpo.forecasting.manager")

class ForecastManager:
    def __init__(self):
        pass

    def create_forecast(self, db: Session, forecast_data: ForecastCreate) -> Forecast:
        forecast = Forecast(**forecast_data.model_dump())
        db.add(forecast)
        db.commit()
        db.refresh(forecast)
        logger.info(f"Created forecast '{forecast.name}' (ID: {forecast.id})")
        return forecast

    def get_forecast(self, db: Session, forecast_id: str) -> Forecast:
        return db.query(Forecast).filter(Forecast.id == forecast_id).first()

    def run_forecast(self, db: Session, run_request: ForecastRunRequest) -> ForecastHistory:
        forecast = self.get_forecast(db, run_request.forecast_id)
        if not forecast:
            raise ValueError(f"Forecast ID {run_request.forecast_id} not found.")

        # Record start of execution in history
        history_record = ForecastHistory(
            forecast_id=forecast.id,
            status="Running",
            version=forecast.version,
            logs={"message": "Forecast execution started."}
        )
        db.add(history_record)
        forecast.status = "Running"
        db.commit()
        db.refresh(history_record)

        # Execution would go here... for now we just mock completion
        history_record.status = "Completed"
        forecast.status = "Completed"
        forecast.updated_at = datetime.now(timezone.utc)
        history_record.logs = {"message": "Forecast execution completed successfully."}
        db.commit()
        
        logger.info(f"Executed forecast '{forecast.name}' (ID: {forecast.id})")
        return history_record

forecast_manager = ForecastManager()
