import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class GridConstraintValidator:
    """Validates if a proposed optimization strategy violates physical grid constraints."""
    
    def __init__(self, db: Session):
        self.db = db

    def validate(self, strategy_name: str, proposed_actions: dict) -> tuple[bool, str]:
        """
        Returns (is_valid, reason).
        Checks basic constraints like battery SOC bounds, line limits.
        """
        # In a real system, this would pull the current digital twin state and run a quick power flow simulation.
        # For Phase 5.4 heuristics, we enforce simple logical rules.
        
        # Example validation: Battery cannot discharge more than its current SOC.
        battery_discharge_mw = proposed_actions.get("battery_discharge_mw", 0)
        current_soc_mwh = 250.0  # Mocked live value for Phase 5
        
        if battery_discharge_mw > current_soc_mwh:
            return False, f"Battery discharge request ({battery_discharge_mw} MW) exceeds current SOC ({current_soc_mwh} MWh)"
            
        # Example validation: Renewable curtailment cannot be negative.
        curtailment = proposed_actions.get("curtailment_mw", 0)
        if curtailment < 0:
            return False, "Proposed renewable curtailment cannot be negative."
            
        return True, "Constraints satisfied"
