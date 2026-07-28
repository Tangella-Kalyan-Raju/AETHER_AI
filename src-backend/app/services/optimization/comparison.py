from typing import Dict, Any, List

class StrategyComparator:
    """
    Simulates and compares alternative optimization strategy profiles
    (Cost First, Carbon First, Balanced, etc.) for side-by-side evaluation.
    """

    def generate_alternative_strategies(
        self,
        base_grid: Dict[str, Any],
        base_cost: Dict[str, Any],
        base_carbon: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        
        # Base metric values
        avg_price = base_cost.get("market_pricing", {}).get("average_price_usd", 74.0)
        co2_avoided = base_carbon.get("emissions", {}).get("co2_avoided_tons", 15.0)

        strategies = [
            {
                "name": "Cost First",
                "operating_cost_usd": 48200.0,
                "carbon_emissions_tons": 38.2,
                "renewable_percentage": 35.0,
                "battery_utilization_pct": 24.5,
                "grid_stability_score": 78,
                "reliability_score": 90,
                "energy_loss_mw": 48.0,
                "reserve_margin_mw": 240.0,
                "ai_confidence": 0.88
            },
            {
                "name": "Carbon First",
                "operating_cost_usd": 72400.0,
                "carbon_emissions_tons": 12.8,
                "renewable_percentage": 75.0,
                "battery_utilization_pct": 82.0,
                "grid_stability_score": 82,
                "reliability_score": 85,
                "energy_loss_mw": 62.0,
                "reserve_margin_mw": 180.0,
                "ai_confidence": 0.82
            },
            {
                "name": "Reliability First",
                "operating_cost_usd": 68500.0,
                "carbon_emissions_tons": 34.5,
                "renewable_percentage": 42.0,
                "battery_utilization_pct": 45.0,
                "grid_stability_score": 95,
                "reliability_score": 98,
                "energy_loss_mw": 44.0,
                "reserve_margin_mw": 380.0,
                "ai_confidence": 0.94
            },
            {
                "name": "Renewable First",
                "operating_cost_usd": 59400.0,
                "carbon_emissions_tons": 18.2,
                "renewable_percentage": 68.0,
                "battery_utilization_pct": 74.0,
                "grid_stability_score": 80,
                "reliability_score": 88,
                "energy_loss_mw": 58.0,
                "reserve_margin_mw": 210.0,
                "ai_confidence": 0.85
            },
            {
                "name": "Balanced",
                "operating_cost_usd": 54200.0,
                "carbon_emissions_tons": 24.8,
                "renewable_percentage": 58.0,
                "battery_utilization_pct": 58.0,
                "grid_stability_score": 88,
                "reliability_score": 92,
                "energy_loss_mw": 52.0,
                "reserve_margin_mw": 290.0,
                "ai_confidence": 0.91
            },
            {
                "name": "Emergency Strategy",
                "operating_cost_usd": 92000.0,
                "carbon_emissions_tons": 45.0,
                "renewable_percentage": 30.0,
                "battery_utilization_pct": 95.0,
                "grid_stability_score": 94,
                "reliability_score": 99,
                "energy_loss_mw": 85.0,
                "reserve_margin_mw": 480.0,
                "ai_confidence": 0.78
            }
        ]

        return strategies
