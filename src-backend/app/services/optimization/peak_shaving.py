from typing import Dict, Any, List

class PeakShavingEngine:
    """
    Identifies peak demand periods using forecasting and dispatches active storage
    and demand response assets to shave peak system loadings.
    """

    def optimize(self, grid_state: Dict[str, Any], forecast_state: Dict[str, Any]) -> Dict[str, Any]:
        # Mock 24-hour forecasted demand curve
        base_demand_curve = [
            7500, 7200, 7100, 7000, 7200, 7800, 8500, 9200, 9800, 10200,
            10500, 10800, 11000, 10700, 10500, 10900, 11500, 12500, 12800, 12000, # Peaks at hour 17-18
            11200, 10200, 9000, 8000
        ]

        shaved_demand_curve = list(base_demand_curve)
        peak_hours = [17, 18, 19]
        battery_support_mw = 450.0
        demand_response_mw = 150.0
        total_shaving = battery_support_mw + demand_response_mw

        # Apply shaving on peak hours
        for hr in peak_hours:
            shaved_demand_curve[hr] = base_demand_curve[hr] - total_shaving

        peak_before = max(base_demand_curve)
        peak_after = max(shaved_demand_curve)

        return {
            "hourly_load_profile": {
                "unshaved_mw": base_demand_curve,
                "shaved_mw": shaved_demand_curve
            },
            "shaving_contributions": {
                "battery_storage_mw": battery_support_mw,
                "demand_response_mw": demand_response_mw,
                "total_shaving_mw": total_shaving
            },
            "metrics": {
                "peak_demand_before_mw": peak_before,
                "peak_demand_after_mw": peak_after,
                "peak_load_reduction_pct": round(((peak_before - peak_after) / peak_before) * 100, 1),
                "peak_duration_hours": len(peak_hours)
            }
        }
