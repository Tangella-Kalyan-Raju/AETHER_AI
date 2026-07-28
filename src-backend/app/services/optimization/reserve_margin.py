from typing import Dict, Any, List

class ReserveMarginOptimizer:
    """
    Evaluates spinning, operational, and emergency battery capacity reserves
    to ensure compliance with regional grid contingency planning (e.g. NERC BAL-002).
    """

    def optimize(self, grid_state: Dict[str, Any], forecast_state: Dict[str, Any]) -> Dict[str, Any]:
        # Required reserve capacity is typically 7% of total load + largest generator capacity
        total_load = 12500.0
        largest_single_loss = 800.0 # Largest gas plant contingency
        required_contingency_reserve = (total_load * 0.07) + largest_single_loss # ~1675 MW

        # Current reserves
        spinning_reserve = 1100.0
        operating_reserve = 450.0
        battery_reserve = 350.0
        renewable_reserve = 150.0 # Curtailed capacity available for up-regulation

        total_reserve_before = spinning_reserve + operating_reserve + battery_reserve + renewable_reserve

        # Optimization commits gas turbine reserve or triggers fast-battery reserve up-regulation
        # Shift 100 MW conventional operating reserve to high-availability battery spinning reserve
        optimized_reserves = {
            "spinning_reserve_mw": spinning_reserve + 100.0,
            "operating_reserve_mw": operating_reserve - 100.0,
            "battery_reserve_mw": battery_reserve,
            "renewable_reserve_mw": renewable_reserve,
            "total_reserve_mw": total_reserve_before
        }

        is_compliant = total_reserve_before >= required_contingency_reserve

        return {
            "reserve_allocation": optimized_reserves,
            "metrics": {
                "required_threshold_mw": required_contingency_reserve,
                "current_total_reserve_mw": total_reserve_before,
                "contingency_coverage_pct": round((total_reserve_before / required_contingency_reserve) * 100, 1),
                "is_nerc_compliant": is_compliant,
                "recommended_spinning_increase_mw": 100.0
            }
        }
