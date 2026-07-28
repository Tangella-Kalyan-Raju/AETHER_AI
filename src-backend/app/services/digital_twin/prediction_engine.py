from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import random

from app.models.dt_foundation_models import AssetRegistry, AssetState, AssetHealth
from app.models.prediction_models import Prediction

def get_utc_now():
    return datetime.now(timezone.utc)

class PredictionEngine:
    def __init__(self, db: Session):
        self.db = db

    def generate_predictions(self, horizon_minutes: int) -> List[Dict]:
        """Generate or retrieve predicted states for a specific time horizon."""
        assets = self.db.query(AssetRegistry).all()
        now = get_utc_now()
        predicted_time = now + timedelta(minutes=horizon_minutes)
        
        predictions = []
        for asset in assets:
            state = self.db.query(AssetState).filter(AssetState.asset_id == asset.id).first()
            health = self.db.query(AssetHealth).filter(AssetHealth.asset_id == asset.id).first()
            
            if not state or not health:
                continue

            # Simulate future predictions based on horizon
            # Longer horizon = higher variance & lower confidence
            variance = horizon_minutes / 1440.0
            confidence = max(40.0, 100.0 - (variance * 40.0) - random.uniform(0, 10))
            
            # Simulated Failure Prediction
            failure_prob = (100.0 - health.health_score) * (1.0 + variance) + random.uniform(0, 5)
            failure_prob = min(100.0, max(0.0, failure_prob))
            
            # Congestion/Utilization
            utilization = state.utilization_pct * (1.0 + random.uniform(-0.1 * variance, 0.2 * variance))
            utilization = min(100.0, max(0.0, utilization))
            
            predictions.append({
                "asset_id": asset.id,
                "asset_name": asset.name,
                "asset_type": asset.type,
                "predicted_time": predicted_time.isoformat(),
                "horizon_minutes": horizon_minutes,
                "confidence": confidence,
                "predictions": {
                    "failure_probability": failure_prob,
                    "utilization_pct": utilization,
                    "active_power": state.active_power * (1.0 + random.uniform(-0.2 * variance, 0.2 * variance)) if state.active_power else None,
                    "voltage": state.voltage * (1.0 + random.uniform(-0.05 * variance, 0.05 * variance)) if state.voltage else None
                },
                "risk_level": self._calculate_risk(failure_prob, utilization)
            })
            
        return predictions

    def _calculate_risk(self, failure_prob: float, utilization: float) -> str:
        if failure_prob > 30.0 or utilization > 90.0:
            return "Critical"
        if failure_prob > 15.0 or utilization > 80.0:
            return "High"
        if failure_prob > 5.0 or utilization > 60.0:
            return "Medium"
        return "Low"
        
    def get_grid_stability(self, horizon_minutes: int) -> Dict:
        """Simulate overall grid stability prediction."""
        variance = horizon_minutes / 1440.0
        stability_score = 100.0 - (variance * 10.0) - random.uniform(0, 5)
        confidence = max(50.0, 98.0 - (variance * 30.0))
        
        return {
            "predicted_time": (get_utc_now() + timedelta(minutes=horizon_minutes)).isoformat(),
            "stability_score": stability_score,
            "confidence": confidence,
            "risk_status": "Stable" if stability_score > 85 else "Caution" if stability_score > 70 else "At Risk"
        }
