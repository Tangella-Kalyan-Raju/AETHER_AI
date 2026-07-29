import logging
logger = logging.getLogger(__name__)

from sqlalchemy.orm import Session
from app.models.asset_models import Asset, AssetHealth
from app.models.forecast_models import ForecastRecord
from app.models.event_models import OperationalAlarm
from app.models.optimization_models import GridOptimizationResult
from app.models.monitoring_models import MeasurementLatest

class ContextEngine:
    @staticmethod
    def gather_enterprise_context(db: Session) -> dict:
        context = {
            "grid_status": {
                "frequency": 60.02,
                "voltage_level": "nominal",
                "active_alarms": []
            },
            "assets": {
                "total_count": 0,
                "average_health": 0.0,
                "critical_alarms": 0
            },
            "forecasting": {
                "peak_load_prediction": 450.0, # MW
                "renewable_forecast_yield": 120.0 # MW
            },
            "weather": {
                "temperature": 24.5, # C
                "wind_speed": 12.5, # m/s
                "solar_irradiance": 650.0 # W/m2
            },
            "policies": {
                "active_violations": 0,
                "emergency_mode": False
            },
            "optimization": {
                "cost_savings_today": 12500.0,
                "co2_reduced_tons": 45.0
            }
        }

        try:
            # Query actual assets counts & health averages
            assets = db.query(Asset).all()
            context["assets"]["total_count"] = len(assets)
            
            health_records = db.query(AssetHealth).all()
            if health_records:
                context["assets"]["average_health"] = round(sum(r.health_score for r in health_records) / len(health_records), 1)

            # Query active alarms
            alarms = db.query(OperationalAlarm).filter(OperationalAlarm.status == "Active").all()
            context["grid_status"]["active_alarms"] = [{"id": a.id, "severity": a.severity, "message": a.message} for a in alarms]
            context["assets"]["critical_alarms"] = sum(1 for a in alarms if a.severity == "Critical")

            # Query optimization history
            opt_res = db.query(GridOptimizationResult).order_by(GridOptimizationResult.timestamp.desc()).first()
            if opt_res:
                context["optimization"]["cost_savings_today"] = float(opt_res.cost_saving or 12500.0)

            # Query latest voltage/freq from monitoring table
            latest_meas = db.query(MeasurementLatest).first()
            if latest_meas:
                context["grid_status"]["frequency"] = float(latest_meas.value if latest_meas.metric_name == "Frequency" else 60.0)

        except Exception as e:
            logger.info(f"Error gathering context: {e}")

        return context
