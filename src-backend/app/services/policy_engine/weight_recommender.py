import logging
from typing import Dict, Any, List, Optional
import uuid

logger = logging.getLogger("gpo.weight_recommender")

class PolicyOptimizationRecommender:
    """
    Intelligent AI Recommendation service to suggest policy optimization weight adjustments
    based on weather alerts, renewable yield forecasts, and battery state parameters.
    """
    @staticmethod
    def generate_recommendations(
        policy_name: str,
        weather_forecast: Dict[str, Any],
        grid_metrics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        recommendations = []

        condition = weather_forecast.get("condition", "Sunny").lower()
        wind_speed = weather_forecast.get("wind_speed_ms", 0.0)
        solar_yield = weather_forecast.get("solar_yield_prediction_mw", 0.0)
        degradation = grid_metrics.get("battery_degradation_index", 0.0)
        peak_load = grid_metrics.get("peak_load_forecast_mw", 0.0)

        # 1. Storm / Outage contingency override
        if "storm" in condition or "lightning" in condition or wind_speed > 20.0:
            recommendations.append({
                "id": "rec-storm-" + str(uuid.uuid4())[:8],
                "type": "STORM_CONTINGENCY",
                "target_policy": policy_name,
                "recommended_weights": {
                    "stability": 0.45,
                    "reliability": 0.45,
                    "cost": 0.05,
                    "carbon": 0.05
                },
                "confidence_score": 0.94,
                "reasoning": f"Severe barometric current front ('{condition}') with wind velocity of {wind_speed} m/s is approaching Reno region. Risk of line outage contingency is high. Recommend increasing Reliability and Stability weights.",
                "expected_outcome": "Enhanced grid resilience, increased spinning reserve margins, and preventive line loading safety.",
                "trade_offs": "Increases immediate dispatch operational cost due to peaker generators startup overrides.",
                "status": "pending"
            })

        # 2. Solar yield saturation / batteries charge
        if solar_yield > 4000.0 or "sunny" in condition and solar_yield > 3000.0:
            recommendations.append({
                "id": "rec-solar-" + str(uuid.uuid4())[:8],
                "type": "HIGH_SOLAR_YIELD",
                "target_policy": policy_name,
                "recommended_weights": {
                    "carbon": 0.65,
                    "stability": 0.15,
                    "cost": 0.10,
                    "reliability": 0.10
                },
                "confidence_score": 0.88,
                "reasoning": f"Extreme solar irradiance forecast ({solar_yield} MW expected yield) at Sierra PV fields. Recommend increasing Renewable Weight and battery charge priority.",
                "expected_outcome": "Zero solar yield curtailment, maximized clean penetration indices, and optimized carbon offsets.",
                "trade_offs": "Slight frequency variations may arise during peak photovoltaic generation periods.",
                "status": "pending"
            })

        # 3. High Battery Cell degradation
        if degradation > 0.15:
            recommendations.append({
                "id": "rec-battery-" + str(uuid.uuid4())[:8],
                "type": "BATTERY_DEGRADATION",
                "target_policy": policy_name,
                "recommended_weights": {
                    "reliability": 0.35,
                    "stability": 0.35,
                    "cost": 0.10,
                    "carbon": 0.20
                },
                "confidence_score": 0.85,
                "reasoning": f"Battery storage state denotes a cell capacity degradation index of {degradation * 100:.1f}%. Recommend reducing battery cycling weight to minimize Depth of Discharge (DOD) limits.",
                "expected_outcome": "Slowed battery capacity degradation, cooler battery cell operating temperatures, and extended lifespan.",
                "trade_offs": "Restricts peak load shaving capacity and limits power arbitrage profit margins.",
                "status": "pending"
            })

        # 4. Extreme Peak Demand hours
        if peak_load > 15000.0:
            recommendations.append({
                "id": "rec-peak-" + str(uuid.uuid4())[:8],
                "type": "PEAK_DEMAND",
                "target_policy": policy_name,
                "recommended_weights": {
                    "cost": 0.35,
                    "carbon": 0.10,
                    "stability": 0.35,
                    "reliability": 0.20
                },
                "confidence_score": 0.91,
                "reasoning": f"Grid load forecast projects peak demand reaching {peak_load} MW. Recommend increasing Peak Shaving and battery discharge weights to relieve substation loading constraints.",
                "expected_outcome": "Reduced loading on transformers, minimized reliance on high-cost spot price peakers.",
                "trade_offs": "Accelerates battery discharge cycles and lowers state-of-charge reserve margins.",
                "status": "pending"
            })

        # Default fallback suggestions
        if not recommendations:
            recommendations.append({
                "id": "rec-tune-" + str(uuid.uuid4())[:8],
                "type": "NOMINAL_OPTIMIZE",
                "target_policy": policy_name,
                "recommended_weights": {
                    "cost": 0.30,
                    "carbon": 0.25,
                    "stability": 0.25,
                    "reliability": 0.20
                },
                "confidence_score": 0.80,
                "reasoning": "Grid metrics and weather forecasts are completely nominal. Recommend balanced weight parameters adjustment to maximize generation cost-savings.",
                "expected_outcome": "Optimized generator dispatch settings with balanced system efficiency scores.",
                "trade_offs": "None. Parameters represent general operational margins.",
                "status": "pending"
            })

        return recommendations
