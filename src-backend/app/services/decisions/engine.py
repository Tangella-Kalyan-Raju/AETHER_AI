from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.models.decision_models import Decision, DecisionMetadata, DecisionExplanation, DecisionRisk, DecisionOpportunity, DecisionHistory

class DecisionEngineService:
    def __init__(self, db: Session):
        self.db = db

    def generate_mock_decisions(self) -> List[Dict[str, Any]]:
        # This will simulate generating AI decisions based on forecasts.
        # In a real implementation, we would pull from ForecastRecord and feed into an LLM/rules engine.
        decisions = [
            {
                "title": "Increase Hydro Output to Offset Solar Drop",
                "type": "Generation Adjustment",
                "priority": "High",
                "confidence_score": 94.5,
                "confidence_category": "Very High",
                "summary": "Incoming cloud cover will reduce solar yield by 150MW. Recommend increasing hydro dispatch by 120MW and battery discharge by 30MW to compensate.",
                "reasoning_chain": [
                    {"step": "Weather Forecast", "finding": "Rapid cloud cover increase detected over next 2 hours."},
                    {"step": "Renewable Forecast", "finding": "Solar generation expected to drop by 150MW."},
                    {"step": "Reserve Forecast", "finding": "Hydro spinning reserve currently at 200MW."},
                    {"step": "Battery Forecast", "finding": "Battery SOC at 82%, sufficient for short-term buffering."}
                ],
                "primary_factors": ["Weather Forecast", "Renewable Forecast"],
                "secondary_factors": ["Reserve Forecast", "Battery Forecast"],
                "risk": {
                    "overall": 12.5,
                    "operational": 10.0,
                    "financial": 15.0,
                    "reliability": 5.0,
                    "renewable": 25.0,
                    "battery": 5.0,
                    "grid_stability": 2.0
                },
                "opportunities": {
                    "cost_savings": 2500.0,
                    "carbon_reduction": 120.0,
                    "renewable_utilisation": 0.0,
                    "reliability": 99.5,
                    "battery_optimisation": 85.0
                }
            },
            {
                "title": "Delay Battery Charging to Off-Peak Hours",
                "type": "Battery Charging",
                "priority": "Medium",
                "confidence_score": 88.2,
                "confidence_category": "High",
                "summary": "Current market price is $65/MWh. Recommend delaying battery charging schedule by 3 hours when price drops to $25/MWh.",
                "reasoning_chain": [
                    {"step": "Price Forecast", "finding": "Market price remains high for the next 2 hours."},
                    {"step": "Demand Forecast", "finding": "Demand will drop by 18% in 3 hours."},
                    {"step": "Battery Forecast", "finding": "Current SOC is 45%, no immediate critical backup required."}
                ],
                "primary_factors": ["Price Forecast", "Demand Forecast"],
                "secondary_factors": ["Battery Forecast"],
                "risk": {
                    "overall": 8.0,
                    "operational": 5.0,
                    "financial": 2.0,
                    "reliability": 15.0,
                    "renewable": 5.0,
                    "battery": 10.0,
                    "grid_stability": 5.0
                },
                "opportunities": {
                    "cost_savings": 4800.0,
                    "carbon_reduction": 0.0,
                    "renewable_utilisation": 0.0,
                    "reliability": 95.0,
                    "battery_optimisation": 92.0
                }
            }
        ]
        return decisions

    def trigger_analysis(self) -> str:
        """
        Trigger the AI analysis pipeline which reads the latest forecasts,
        generates decisions, and stores them in the DB.
        """
        # Delete existing pending decisions for a clean demo slate (optional)
        # self.db.query(Decision).filter(Decision.status == "Pending").delete()
        
        mock_data = self.generate_mock_decisions()
        new_decisions = []
        for data in mock_data:
            # Create Decision
            decision = Decision(
                title=data["title"],
                type=data["type"],
                priority=data["priority"],
                confidence_score=data["confidence_score"],
                confidence_category=data["confidence_category"],
                status="Pending"
            )
            self.db.add(decision)
            self.db.flush()
            
            # Metadata
            meta = DecisionMetadata(
                decision_id=decision.id,
                forecast_sources=data["primary_factors"] + data["secondary_factors"],
                processing_time_ms=1240.5
            )
            self.db.add(meta)
            
            # Explanation
            explanation = DecisionExplanation(
                decision_id=decision.id,
                summary=data["summary"],
                reasoning_chain=data["reasoning_chain"],
                primary_factors=data["primary_factors"],
                secondary_factors=data["secondary_factors"]
            )
            self.db.add(explanation)
            
            # Risk
            risk = DecisionRisk(
                decision_id=decision.id,
                overall_risk_score=data["risk"]["overall"],
                operational_risk=data["risk"]["operational"],
                financial_risk=data["risk"]["financial"],
                reliability_risk=data["risk"]["reliability"],
                renewable_risk=data["risk"]["renewable"],
                battery_risk=data["risk"]["battery"],
                grid_stability_risk=data["risk"]["grid_stability"]
            )
            self.db.add(risk)
            
            # Opportunities
            opp = DecisionOpportunity(
                decision_id=decision.id,
                expected_cost_savings=data["opportunities"]["cost_savings"],
                expected_carbon_reduction=data["opportunities"]["carbon_reduction"],
                renewable_utilisation_increase=data["opportunities"]["renewable_utilisation"],
                reliability_improvement=data["opportunities"]["reliability"],
                battery_optimisation_potential=data["opportunities"]["battery_optimisation"]
            )
            self.db.add(opp)
            
            # History
            history = DecisionHistory(
                decision_id=decision.id,
                action="Generated",
                details={"message": "AI Decision Engine generated recommendation based on multi-domain forecast analysis."}
            )
            self.db.add(history)
            
            new_decisions.append(decision)
            
        self.db.commit()
        return "Analysis completed. 2 new recommendations generated."

    def get_decisions(self):
        decisions = self.db.query(Decision).order_by(Decision.created_at.desc()).all()
        result = []
        for d in decisions:
            meta = self.db.query(DecisionMetadata).filter(DecisionMetadata.decision_id == d.id).first()
            exp = self.db.query(DecisionExplanation).filter(DecisionExplanation.decision_id == d.id).first()
            risk = self.db.query(DecisionRisk).filter(DecisionRisk.decision_id == d.id).first()
            opp = self.db.query(DecisionOpportunity).filter(DecisionOpportunity.decision_id == d.id).first()
            
            result.append({
                "id": d.id,
                "title": d.title,
                "type": d.type,
                "priority": d.priority,
                "confidence_score": d.confidence_score,
                "confidence_category": d.confidence_category,
                "status": d.status,
                "created_at": d.created_at,
                "metadata": {
                    "forecast_sources": meta.forecast_sources if meta else [],
                    "processing_time_ms": meta.processing_time_ms if meta else 0
                },
                "explanation": {
                    "summary": exp.summary if exp else "",
                    "reasoning_chain": exp.reasoning_chain if exp else [],
                    "primary_factors": exp.primary_factors if exp else [],
                    "secondary_factors": exp.secondary_factors if exp else []
                },
                "risk": {
                    "overall_risk_score": risk.overall_risk_score if risk else 0,
                    "operational_risk": risk.operational_risk if risk else 0,
                    "financial_risk": risk.financial_risk if risk else 0,
                    "reliability_risk": risk.reliability_risk if risk else 0,
                    "renewable_risk": risk.renewable_risk if risk else 0,
                    "battery_risk": risk.battery_risk if risk else 0,
                    "grid_stability_risk": risk.grid_stability_risk if risk else 0
                },
                "opportunities": {
                    "expected_cost_savings": opp.expected_cost_savings if opp else 0,
                    "expected_carbon_reduction": opp.expected_carbon_reduction if opp else 0,
                    "renewable_utilisation_increase": opp.renewable_utilisation_increase if opp else 0,
                    "reliability_improvement": opp.reliability_improvement if opp else 0,
                    "battery_optimisation_potential": opp.battery_optimisation_potential if opp else 0
                }
            })
        return result
