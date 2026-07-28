import logging
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.forecast_models import ForecastModelRegistry, ForecastRecord
from app.services.forecasting.forecasters import (
    WeatherForecaster, RenewableForecaster, DemandForecaster,
    CarbonForecaster, StorageForecaster
)

logger = logging.getLogger(__name__)

class ForecastManager:
    def __init__(self, db: Session):
        self.db = db
        self.horizons = [30, 60, 180, 360, 720, 1440] # 30m, 1h, 3h, 6h, 12h, 24h
        
    def _get_or_create_model(self, name: str, domain: str) -> str:
        model = self.db.query(ForecastModelRegistry).filter_by(name=name, domain=domain).first()
        if not model:
            model = ForecastModelRegistry(
                name=name,
                domain=domain,
                version="v1.0.0",
                description=f"Physics heuristic forecasting for {domain}"
            )
            self.db.add(model)
            self.db.commit()
        return model.id

    def generate_all_forecasts(self):
        """Generates all enterprise forecasts and saves them to the repository."""
        logger.info("[ForecastManager] Starting enterprise forecasting generation.")
        now = datetime.now(timezone.utc)
        
        # 1. Weather
        weather_model = self._get_or_create_model("HeuristicWeather", "weather")
        base_temp = 22.5 # Should be pulled from live
        
        # 2. Demand
        demand_model = self._get_or_create_model("HeuristicDemand", "demand")
        base_demand = 12000.0
        
        # 3. Renewables
        renewable_model = self._get_or_create_model("HeuristicRenewable", "renewable")
        solar_capacity = 3000.0
        wind_capacity = 2500.0
        
        # 4. Carbon
        carbon_model = self._get_or_create_model("HeuristicCarbon", "carbon")
        
        # 5. Storage
        storage_model = self._get_or_create_model("HeuristicStorage", "storage")
        storage_capacity = 500.0
        current_soc = 250.0

        for horizon in self.horizons:
            target = now + __import__("datetime").timedelta(minutes=horizon)
            
            # Weather
            wf = WeatherForecaster.generate(base_temp, horizon, now)
            self._save_record(weather_model, "weather", "temperature", now, target, horizon, wf)
            
            # Renewables
            sf = RenewableForecaster.generate_solar(500, solar_capacity, horizon, now)
            windf = RenewableForecaster.generate_wind(6.5, wind_capacity, horizon)
            self._save_record(renewable_model, "solar", "generation_mw", now, target, horizon, sf)
            self._save_record(renewable_model, "wind", "generation_mw", now, target, horizon, windf)
            
            # Demand
            df = DemandForecaster.generate(base_demand, horizon, now)
            self._save_record(demand_model, "demand", "total_demand_mw", now, target, horizon, df)
            
            # Carbon
            total_ren = sf["predicted_value"] + windf["predicted_value"]
            cf = CarbonForecaster.generate(df["predicted_value"], total_ren, horizon)
            self._save_record(carbon_model, "carbon", "intensity_gco2_kwh", now, target, horizon, cf)
            
            # Storage
            net_load = df["predicted_value"] - total_ren
            stf = StorageForecaster.generate(net_load, current_soc, storage_capacity, horizon)
            self._save_record(storage_model, "storage", "soc_mwh", now, target, horizon, stf)
            
        self.db.commit()
        logger.info("[ForecastManager] Finished generating forecasts across all horizons.")
        
    def _save_record(self, model_id: str, domain: str, metric_name: str, 
                     generated_at: datetime, target: datetime, horizon: int, data: dict):
        rec = ForecastRecord(
            model_id=model_id,
            domain=domain,
            metric_name=metric_name,
            generated_at=generated_at,
            target_timestamp=target,
            horizon_minutes=horizon,
            predicted_value=data["predicted_value"],
            lower_bound=data["lower_bound"],
            upper_bound=data["upper_bound"],
            confidence_score=data["confidence_score"]
        )
        self.db.add(rec)
