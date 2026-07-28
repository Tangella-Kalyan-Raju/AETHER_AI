from typing import Dict, Any, List

class TradeOffAnalyzer:
    """
    Evaluates competing grid criteria (e.g. clean solar penetration vs battery wear
    vs operating expenses) to compile structured tradeoff summaries.
    """

    def analyze_tradeoffs(
        self,
        strategies: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        tradeoffs = {}
        for s in strategies:
            name = s["name"]
            
            # Simple heuristic tradeoff mapping
            if name == "Cost First":
                benefits = "Minimizes daily fuel expenses and grid import tariffs."
                drawbacks = "May increase local carbon footprint by relying on cheaper thermal base generation."
                financial_impact = "EXCELLENT"
                environmental_impact = "POOR"
                reliability_impact = "MODERATE"
            elif name == "Carbon First":
                benefits = "Prioritizes zero-emission wind and solar generators, maximizing emissions tax credits."
                drawbacks = "High battery cycling and start-up costs for backup conventional reserves."
                financial_impact = "POOR"
                environmental_impact = "EXCELLENT"
                reliability_impact = "MODERATE"
            elif name == "Reliability First":
                benefits = "Maintains NERC reserves and high contingency spinning margins."
                drawbacks = "Requires keeping fossil-fuel backup units online, raising fixed operations cost."
                financial_impact = "MODERATE"
                environmental_impact = "MODERATE"
                reliability_impact = "EXCELLENT"
            elif name == "Balanced":
                benefits = "Provides a optimized compromise between stability, budget, and carbon offsets."
                drawbacks = "Sub-optimal in any single parameter but matches target weighting vectors."
                financial_impact = "GOOD"
                environmental_impact = "GOOD"
                reliability_impact = "GOOD"
            else:
                benefits = "Emergency reserves deployed to prevent load shedding or low frequency drop."
                drawbacks = "High battery wear and maximum load curtailment tariff penalties."
                financial_impact = "CRITICAL"
                environmental_impact = "MODERATE"
                reliability_impact = "CRITICAL"

            tradeoffs[name] = {
                "benefits": benefits,
                "drawbacks": drawbacks,
                "impacts": {
                    "financial": financial_impact,
                    "environmental": environmental_impact,
                    "reliability": reliability_impact
                }
            }

        return tradeoffs
