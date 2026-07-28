from typing import Dict, Any

class BaseOptimizer:
    def optimize(self, current_state: dict, forecast_state: dict) -> Dict[str, Any]:
        raise NotImplementedError

class GreenModeOptimizer(BaseOptimizer):
    """Maximizes renewable utilization and battery deployment."""
    def optimize(self, current_state: dict, forecast_state: dict) -> Dict[str, Any]:
        solar = forecast_state.get("solar_mw", 0)
        wind = forecast_state.get("wind_mw", 0)
        demand = forecast_state.get("demand_mw", 0)
        
        total_ren = solar + wind
        battery_action = 0.0
        
        # If renewables don't cover demand, discharge battery to cover the gap
        if total_ren < demand:
            gap = demand - total_ren
            battery_action = min(gap, 250.0) # max discharge capacity
            
        return {
            "strategy_name": "Green Mode",
            "description": "Maximize renewable utilization by discharging batteries to offset fossil generation.",
            "actions": {
                "battery_discharge_mw": battery_action,
                "curtailment_mw": max(0, total_ren - demand)
            },
            "expected_savings": battery_action * 45.0, # Mock 45 $/MW savings
            "carbon_reduction": battery_action * 0.45, # Mock 0.45 tons/MW reduction
            "renewable_increase": min(100, (battery_action / demand) * 100) if demand > 0 else 0,
            "confidence_score": 92.5
        }

class EconomicModeOptimizer(BaseOptimizer):
    """Minimizes overall dispatch cost based on market prices."""
    def optimize(self, current_state: dict, forecast_state: dict) -> Dict[str, Any]:
        # Heuristic: Discharge battery only during peak demand times
        demand = forecast_state.get("demand_mw", 0)
        is_peak = demand > 10000.0
        
        battery_action = 200.0 if is_peak else -50.0 # Discharge at peak, charge otherwise
        
        return {
            "strategy_name": "Economic Mode",
            "description": "Shift non-critical loads and dispatch batteries during peak pricing.",
            "actions": {
                "battery_discharge_mw": max(0, battery_action),
                "battery_charge_mw": abs(min(0, battery_action))
            },
            "expected_savings": 8500.0 if is_peak else 1200.0,
            "carbon_reduction": 3.2,
            "renewable_increase": 2.0,
            "confidence_score": 88.0
        }

class CarbonModeOptimizer(BaseOptimizer):
    """Prioritizes lowest emission sources."""
    def optimize(self, current_state: dict, forecast_state: dict) -> Dict[str, Any]:
        return {
            "strategy_name": "Carbon Mode",
            "description": "Dispatch all available zero-carbon assets.",
            "actions": {},
            "expected_savings": 1000.0,
            "carbon_reduction": 25.0,
            "renewable_increase": 10.0,
            "confidence_score": 85.0
        }
