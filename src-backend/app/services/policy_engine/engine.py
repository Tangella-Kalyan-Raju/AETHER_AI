import logging
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.grid_models import Policy, PolicyExecution, PolicyVersion
from app.models.system_models import AuditLog
from datetime import datetime

logger = logging.getLogger("gpo.policy_engine")

class PolicyManager:
    """
    Manages loading, activating, switching and conflict resolution of operational policies.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_active_policy(self) -> Optional[Policy]:
        """Fetch the currently active operating policy."""
        return self.db.query(Policy).filter(Policy.is_active == True, Policy.is_deleted == False).first()

    def activate_policy(self, policy_id: int, user_id: Optional[int] = None) -> Policy:
        """
        Switches the active policy dynamically.
        Deactivates all other policies and logs the deployment transaction.
        """
        policy = self.db.query(Policy).filter(Policy.id == policy_id, Policy.is_deleted == False).first()
        if not policy:
            raise ValueError(f"Policy with ID {policy_id} not found.")

        # Deactivate all other policies
        self.db.query(Policy).filter(Policy.id != policy_id).update({"is_active": False})
        
        # Activate selected policy
        policy.is_active = True
        policy.updated_at = datetime.utcnow()
        
        # Log to Audit Log
        audit = AuditLog(
            user_id=user_id,
            action="policy.activate",
            details=f"Operational Policy switched to: '{policy.name}' (Objective: {policy.objective})",
            status="success"
        )
        self.db.add(audit)
        
        # Log a mock execution trigger
        latest_version = self.db.query(PolicyVersion).filter(PolicyVersion.policy_id == policy.id).first()
        if latest_version:
            exec_log = PolicyExecution(
                policy_version_id=latest_version.id,
                status="success",
                details={
                    "event": "policy_switched",
                    "policy_name": policy.name,
                    "activated_by": user_id,
                    "applied_weights": policy.weights
                },
                execution_time=0.15
            )
            self.db.add(exec_log)

        self.db.commit()
        self.db.refresh(policy)
        logger.info(f"Policy switched dynamically to: {policy.name}")
        return policy

    def resolve_conflicts(self, policy: Policy) -> List[str]:
        """
        Detects operational incompatibilities or overriding emergency parameters.
        """
        conflicts = []
        if not policy:
            return conflicts

        # Emergency Mode Override Check
        if policy.priority >= 10:
            conflicts.append(f"EMERGENCY OVERRIDE: '{policy.name}' holds critical priority ({policy.priority}). Cost objectives are completely disabled.")
        
        # Weight check
        w = policy.weights or {}
        cost_w = w.get("cost", 0)
        stability_w = w.get("stability", 0)
        
        if cost_w > 0.7 and stability_w < 0.15:
            conflicts.append("STABILITY RISK: High economic weight minimizes operational reserve margins. Voltage fluctuation risks increased.")
        
        # Peak demand vs battery preservation conflicts
        constraints = policy.constraints or {}
        min_soc = constraints.get("min_soc_pct", 0)
        
        if policy.objective == "PEAK_SHAVING" and min_soc > 30:
            conflicts.append("RESOURCE CONFLICT: Peak demand shaving requires deep battery discharging, but min SOC limit is high.")
            
        return conflicts


class PolicyExecutionEngine:
    """
    Exposes policy outputs (e.g. optimizer weights and constraints) to the solvers.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_solver_overrides(self, active_policy: Optional[Policy]) -> Dict[str, Any]:
        """
        Compiles solver weights and constraint limits based on active policy parameters.
        """
        if not active_policy:
            # Default fallback (Balanced)
            return {
                "weights": {"cost": 0.25, "carbon": 0.25, "stability": 0.25, "reliability": 0.25},
                "constraints": {"voltage_deviation_pct": 5.0, "thermal_limit_pct": 90.0, "min_soc_pct": 20.0}
            }

        return {
            "weights": active_policy.weights or {},
            "constraints": active_policy.constraints or {},
            "objective": active_policy.objective
        }

    def evaluate_rules(self, active_policy: Policy, grid_metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Evaluates real-time SCADA telemetry against active policy constraints.
        Returns violations details.
        """
        violations = []
        if not active_policy or not active_policy.constraints:
            return violations

        limits = active_policy.constraints
        
        # 1. Voltage Deviation Check
        voltage_dev = grid_metrics.get("voltage_deviation_pct", 0.0)
        max_voltage_dev = limits.get("voltage_deviation_pct", 5.0)
        if voltage_dev > max_voltage_dev:
            violations.append({
                "metric": "voltage_deviation_pct",
                "value": voltage_dev,
                "limit": max_voltage_dev,
                "status": "VIOLATION",
                "message": f"Voltage deviation ({voltage_dev}%) exceeds policy limit ({max_voltage_dev}%)"
            })

        # 2. Thermal Limits Check
        thermal_loading = grid_metrics.get("max_thermal_loading_pct", 0.0)
        max_thermal = limits.get("thermal_limit_pct", 90.0)
        if thermal_loading > max_thermal:
            violations.append({
                "metric": "max_thermal_loading_pct",
                "value": thermal_loading,
                "limit": max_thermal,
                "status": "VIOLATION",
                "message": f"Transmission line loading ({thermal_loading}%) exceeds safety margin ({max_thermal}%)"
            })

        # 3. Battery State of Charge Check
        soc = grid_metrics.get("battery_soc_pct", 100.0)
        min_soc = limits.get("min_soc_pct", 20.0)
        if soc < min_soc:
            violations.append({
                "metric": "battery_soc_pct",
                "value": soc,
                "limit": min_soc,
                "status": "VIOLATION",
                "message": f"Battery State of Charge ({soc}%) is below minimum preservation threshold ({min_soc}%)"
            })

        return violations


class PolicyValidationEngine:
    """
    Validates policy parameters to prevent mathematically invalid or hazardous configurations.
    """
    @staticmethod
    def validate_config(weights: Dict[str, float], constraints: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validates weights sum to 1.0 (with a margin) and checks for contradictory boundaries.
        """
        warnings = []
        is_valid = True

        # Sum of weights check
        if weights:
            total_w = sum(weights.values())
            if not (0.95 <= total_w <= 1.05):
                is_valid = False
                warnings.append(f"WEIGHTS ERROR: Objective weights must sum to approximately 1.0 (current sum: {total_w:.2f}).")
            
            for k, val in weights.items():
                if val < 0.0:
                    is_valid = False
                    warnings.append(f"WEIGHTS ERROR: Weight for '{k}' cannot be negative ({val}).")

        # Contradictory constraints checks
        if constraints:
            voltage = constraints.get("voltage_deviation_pct", 5.0)
            if voltage <= 0.0:
                is_valid = False
                warnings.append("CONSTRAINTS ERROR: Voltage deviation limit must be positive.")

            min_soc = constraints.get("min_soc_pct", 20.0)
            if not (0.0 <= min_soc <= 100.0):
                is_valid = False
                warnings.append("CONSTRAINTS ERROR: Minimum State of Charge (SOC) must be between 0% and 100%.")

        return is_valid, warnings


class PolicyEngine:
    """
    Facade class grouping GPO policy operations.
    """
    def __init__(self, db: Session):
        self.manager = PolicyManager(db)
        self.execution = PolicyExecutionEngine(db)
        self.validator = PolicyValidationEngine()
