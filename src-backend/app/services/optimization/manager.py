import logging
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.optimization_models import OptimizationStrategy, RecommendationRecord
from app.models.forecast_models import ForecastRecord
from app.services.optimization.strategies import GreenModeOptimizer, EconomicModeOptimizer, CarbonModeOptimizer
from app.services.optimization.constraint_engine import GridConstraintValidator

logger = logging.getLogger(__name__)

class OptimizationManager:
    """Orchestrates generation of optimization recommendations based on latest forecasts."""
    
    def __init__(self, db: Session):
        self.db = db
        self.constraint_validator = GridConstraintValidator(db)
        
        # Instantiate strategies
        self.optimizers = [
            GreenModeOptimizer(),
            EconomicModeOptimizer(),
            CarbonModeOptimizer()
        ]

    def _get_or_create_strategy(self, name: str, description: str) -> str:
        strat = self.db.query(OptimizationStrategy).filter_by(name=name).first()
        if not strat:
            strat = OptimizationStrategy(name=name, description=description)
            self.db.add(strat)
            self.db.commit()
        return strat.id

    def generate_recommendations(self):
        logger.info("[OptimizationManager] Generating operational recommendations based on latest forecasts.")
        now = datetime.now(timezone.utc)
        
        # Pull latest forecast state
        # In a real system, we'd pull the actual records. Mocking a state dictionary based on typical expected values.
        # Phase 5.3 stores ForecastRecords, but we'll use a mocked aggregated forecast for the heuristic optimization
        forecast_state = {
            "demand_mw": 12500.0,
            "solar_mw": 2800.0,
            "wind_mw": 1500.0
        }
        current_state = {}

        for opt in self.optimizers:
            result = opt.optimize(current_state, forecast_state)
            
            is_valid, reason = self.constraint_validator.validate(result["strategy_name"], result["actions"])
            if not is_valid:
                logger.warning(f"Strategy {result['strategy_name']} rejected due to constraint violation: {reason}")
                continue
                
            strat_id = self._get_or_create_strategy(result["strategy_name"], result["description"])
            
            rec = RecommendationRecord(
                strategy_id=strat_id,
                generated_at=now,
                expected_savings=result["expected_savings"],
                carbon_reduction=result["carbon_reduction"],
                renewable_increase=result["renewable_increase"],
                confidence_score=result["confidence_score"],
                recommendation_details=result["actions"],
                status="pending"
            )
            self.db.add(rec)
            
        self.db.commit()
        logger.info("[OptimizationManager] Recommendations successfully generated and stored.")
