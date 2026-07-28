from typing import Dict, Any

class WhatIfEngine:
    """
    Simulates hypothetical sandbox changes (e.g. demand spikes or solar drops)
    and projects their operational, cost, and risk effects without affecting production.
    """

    def evaluate_what_if(
        self,
        situation: str,
        value_change_pct: float,
        base_grid: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Default baseline values
        stability = 88.0
        cost_usd = 54200.0
        co2_tons = 24.8
        reliability = 92.0
        risk_level = "LOW"
        explanation = ""

        # Apply override logic
        if situation == "solar_drop":
            # Solar generation drops -> conventional thermal picks up or batteries discharge
            # Increase cost, increase carbon, decrease stability slightly
            factor = 1.0 + (abs(value_change_pct) / 100.0)
            cost_usd *= (1.0 + 0.15 * (abs(value_change_pct) / 100.0))
            co2_tons *= (1.0 + 0.18 * (abs(value_change_pct) / 100.0))
            stability -= 4.0 * (abs(value_change_pct) / 100.0)
            risk_level = "MODERATE" if abs(value_change_pct) > 20 else "LOW"
            explanation = f"A {value_change_pct}% drop in renewable solar generation shifts dispatch to conventional base reserves, increasing fuel cost by ${(cost_usd - 54200.0):.2f} and emissions by {(co2_tons - 24.8):.1f} tons of CO2."

        elif situation == "battery_increase":
            # Storage capacity increases -> battery arbitrage and peak shaving capacity improves
            # Reduce cost, reduce carbon, increase stability
            cost_usd *= (1.0 - 0.08 * (abs(value_change_pct) / 100.0))
            co2_tons *= (1.0 - 0.05 * (abs(value_change_pct) / 100.0))
            stability += 3.0 * (abs(value_change_pct) / 100.0)
            explanation = f"Increasing battery capacity by {value_change_pct}% yields higher peak shaving margins and battery arbitrage savings of ${(54200.0 - cost_usd):.2f} while improving grid stability to {stability:.1f}/100."

        elif situation == "demand_rise":
            # Demand rises -> loads increase, congestion risks rise
            # Increase cost, increase carbon, decrease stability, increase risk
            cost_usd *= (1.0 + 0.25 * (abs(value_change_pct) / 100.0))
            co2_tons *= (1.0 + 0.22 * (abs(value_change_pct) / 100.0))
            stability -= 8.0 * (abs(value_change_pct) / 100.0)
            reliability -= 6.0 * (abs(value_change_pct) / 100.0)
            risk_level = "HIGH" if abs(value_change_pct) > 15 else "MODERATE"
            explanation = f"A {value_change_pct}% spike in grid demand leads to feeder congestion, dropping frequency stability to {stability:.1f} and raising contingency risk level to {risk_level}."

        else: # market_price_double
            # Market prices double
            # Increase cost savings potential via battery arbitrage
            cost_usd *= (1.0 + 0.40 * (abs(value_change_pct) / 100.0))
            explanation = f"Doubling electricity tariffs increases utility-scale battery arbitrage revenue potential but spikes commercial load supply cost to ${cost_usd:.2f}."

        return {
            "situation": situation,
            "value_change_pct": value_change_pct,
            "projected": {
                "grid_stability_score": round(stability, 1),
                "operating_cost_usd": round(cost_usd, 2),
                "carbon_emissions_tons": round(co2_tons, 2),
                "reliability_score": round(reliability, 1),
                "risk_level": risk_level
            },
            "ai_projected_recommendation": explanation
        }
