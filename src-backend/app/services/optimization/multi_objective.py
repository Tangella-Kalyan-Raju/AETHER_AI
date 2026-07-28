from typing import Dict, Any

class MultiObjectiveEngine:
    """
    Simultaneously balances raw grid variables across competing priorities
    (stability, carbon index, operational expense, clean penetration)
    using dynamic operator weights.
    """

    def evaluate_fitness(
        self,
        grid_metrics: Dict[str, Any],
        cost_metrics: Dict[str, Any],
        carbon_metrics: Dict[str, Any],
        weights: Dict[str, float]
    ) -> float:
        # Normalize sub-scores between 0 and 100
        stability_score = float(grid_metrics.get("overall_score", 85.0))
        
        # Cost score: higher savings -> higher score (normalized offset)
        cost_savings = float(cost_metrics.get("metrics", {}).get("total_savings_usd", 12500.0))
        cost_score = min((cost_savings / 45000.0) * 100.0, 100.0)

        # Carbon score: higher avoided emissions -> higher score
        co2_avoided = float(carbon_metrics.get("emissions", {}).get("co2_avoided_tons", 15.0))
        carbon_score = min((co2_avoided / 50.0) * 100.0, 100.0)

        # Reliability & reserves
        reserve_compliant = grid_metrics.get("reserve_margin", {}).get("metrics", {}).get("is_nerc_compliant", True)
        reliability_score = 98.0 if reserve_compliant else 65.0

        # Retrieve weights (default to equal weights if missing)
        w_stability = weights.get("stability", 0.25)
        w_cost = weights.get("cost", 0.25)
        w_carbon = weights.get("carbon", 0.25)
        w_reliability = weights.get("reliability", 0.25)

        # Normalize weights to sum to 1.0
        total_w = w_stability + w_cost + w_carbon + w_reliability
        if total_w > 0:
            w_stability /= total_w
            w_cost /= total_w
            w_carbon /= total_w
            w_reliability /= total_w
        else:
            w_stability = w_cost = w_carbon = w_reliability = 0.25

        weighted_fitness = (
            (stability_score * w_stability) +
            (cost_score * w_cost) +
            (carbon_score * w_carbon) +
            (reliability_score * w_reliability)
        )

        return round(weighted_fitness, 2)
