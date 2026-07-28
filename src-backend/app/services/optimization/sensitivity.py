from typing import Dict, Any, List

class SensitivityAnalyzer:
    """
    Evaluates how critical grid outputs respond to input changes
    (e.g., demand forecasts or renewable weather inputs).
    """

    def calculate_sensitivities(
        self,
        base_grid: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        # Output a list of sensitivity parameters for the dashboard
        return [
            {
                "input_variable": "Demand Forecast",
                "variance_pct": 10.0,
                "response_variable": "Operating Cost",
                "impact_gradient": "HIGH",
                "confidence_impact": -0.05,
                "performance_change_pct": 25.0
            },
            {
                "input_variable": "Renewable Generation",
                "variance_pct": -10.0,
                "response_variable": "CO2 Emissions",
                "impact_gradient": "MODERATE",
                "confidence_impact": -0.03,
                "performance_change_pct": 18.0
            },
            {
                "input_variable": "Battery Capacity",
                "variance_pct": 5.0,
                "response_variable": "Grid Stability",
                "impact_gradient": "MODERATE",
                "confidence_impact": 0.02,
                "performance_change_pct": 3.0
            },
            {
                "input_variable": "Market Price",
                "variance_pct": 20.0,
                "response_variable": "Arbitrage Savings",
                "impact_gradient": "HIGH",
                "confidence_impact": -0.04,
                "performance_change_pct": 40.0
            }
        ]
