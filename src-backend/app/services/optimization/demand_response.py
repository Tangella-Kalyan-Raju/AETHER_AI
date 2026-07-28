from typing import Dict, Any, List

class DemandResponseEngine:
    """
    Schedules load curtailment and shift instructions across industrial,
    commercial, and residential consumer categories.
    """

    def optimize(self, grid_state: Dict[str, Any], forecast_state: Dict[str, Any]) -> Dict[str, Any]:
        categories = [
            {"tier": "Industrial", "description": "Large manufacturing and processing facilities", "flexible_capacity_mw": 120.0, "critical": False},
            {"tier": "Commercial", "description": "Retail, offices, and HVAC flex systems", "flexible_capacity_mw": 80.0, "critical": False},
            {"tier": "Residential", "description": "Smart thermostats and EV smart chargers", "flexible_capacity_mw": 45.0, "critical": False},
            {"tier": "CriticalInfrastructure", "description": "Hospitals, transport networks, water facilities", "flexible_capacity_mw": 0.0, "critical": True}
        ]

        target_reduction = 200.0 # MW requested by grid conditions
        dispatched_reduction = 0.0
        details = []

        # Dispatch non-critical customer pools
        for c in categories:
            if c["critical"]:
                dispatched = 0.0
            else:
                # Dispatch up to 90% of flexible capacity for DR event
                dispatched = round(c["flexible_capacity_mw"] * 0.85, 2)
                dispatched_reduction += dispatched

            details.append({
                "tier": c["tier"],
                "available_flexible_capacity_mw": c["flexible_capacity_mw"],
                "dispatched_reduction_mw": dispatched,
                "is_critical": c["critical"]
            })

        # Calculate shifted energy to off-peak periods (e.g. night slots)
        shifted_energy_mwh = round(dispatched_reduction * 2.5, 2) # Shifting over a 2.5 hour event window

        return {
            "dispatched_tiers": details,
            "metrics": {
                "requested_reduction_mw": target_reduction,
                "achieved_reduction_mw": round(dispatched_reduction, 2),
                "reduction_imbalance_mw": round(max(0.0, target_reduction - dispatched_reduction), 2),
                "demand_shift_energy_mwh": shifted_energy_mwh,
                "tier_participation_rate_pct": 85.0
            }
        }
