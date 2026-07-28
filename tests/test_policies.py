import pytest
from app.services.policy_engine.engine import PolicyEngine, PolicyValidationEngine
from app.models.grid_models import Policy

def test_policy_validator_valid_config():
    """Verify that a valid weight/constraint matrix returns True with no warnings."""
    weights = {"cost": 0.25, "carbon": 0.25, "stability": 0.25, "reliability": 0.25}
    constraints = {"voltage_deviation_pct": 5.0, "min_soc_pct": 20.0}
    is_valid, warnings = PolicyValidationEngine.validate_config(weights, constraints)
    
    assert is_valid is True
    assert len(warnings) == 0

def test_policy_validator_invalid_weights_sum():
    """Verify validation fails if weights do not sum to approximately 1.0."""
    weights = {"cost": 0.8, "carbon": 0.5} # Sum: 1.30
    constraints = {"voltage_deviation_pct": 5.0}
    is_valid, warnings = PolicyValidationEngine.validate_config(weights, constraints)
    
    assert is_valid is False
    assert any("sum" in w.lower() for w in warnings)

def test_policy_validator_negative_weight():
    """Verify validation fails if any weight coefficient is negative."""
    weights = {"cost": 1.2, "carbon": -0.2}
    constraints = {"voltage_deviation_pct": 5.0}
    is_valid, warnings = PolicyValidationEngine.validate_config(weights, constraints)
    
    assert is_valid is False
    assert any("negative" in w.lower() for w in warnings)

def test_policy_validator_invalid_constraints():
    """Verify validation fails for invalid constraints like negative voltage deviation bounds."""
    weights = {"cost": 1.0}
    constraints = {"voltage_deviation_pct": -2.0}
    is_valid, warnings = PolicyValidationEngine.validate_config(weights, constraints)
    
    assert is_valid is False
    assert any("voltage" in w.lower() for w in warnings)

def test_conflict_resolution_emergency_mode():
    """Verify conflict resolution issues warning for emergency override priority values."""
    policy = Policy(
        name="Emergency Mode",
        objective="EMERGENCY_SAFEGUARD",
        priority=10,
        weights={"cost": 0.0, "stability": 0.6, "reliability": 0.4},
        constraints={"voltage_deviation_pct": 8.0, "min_soc_pct": 10.0}
    )
    # Using PolicyEngine facade manager with None db for mock checks
    from app.services.policy_engine.engine import PolicyManager
    mgr = PolicyManager(None)
    conflicts = mgr.resolve_conflicts(policy)
    
    assert len(conflicts) > 0
    assert any("override" in c.lower() for c in conflicts)

def test_conflict_resolution_risk_weights():
    """Verify conflict checks flag stability risk under excessive cost focus."""
    policy = Policy(
        name="Extreme Cost Savings",
        objective="MIN_COST",
        priority=2,
        weights={"cost": 0.90, "stability": 0.05, "carbon": 0.05},
        constraints={"voltage_deviation_pct": 5.0, "min_soc_pct": 15.0}
    )
    from app.services.policy_engine.engine import PolicyManager
    mgr = PolicyManager(None)
    conflicts = mgr.resolve_conflicts(policy)
    
    assert len(conflicts) > 0
    assert any("stability risk" in c.lower() for c in conflicts)

def test_policy_execution_rules_nominal():
    """Verify that a nominal grid state passes all safety checks with no violations."""
    policy = Policy(
        name="Balanced",
        objective="BALANCED",
        constraints={"voltage_deviation_pct": 5.0, "thermal_limit_pct": 90.0, "min_soc_pct": 20.0}
    )
    from app.services.policy_engine.engine import PolicyExecutionEngine
    exec_engine = PolicyExecutionEngine(None)
    
    grid_metrics = {
        "voltage_deviation_pct": 1.2,
        "max_thermal_loading_pct": 45.0,
        "battery_soc_pct": 80.0
    }
    violations = exec_engine.evaluate_rules(policy, grid_metrics)
    assert len(violations) == 0

def test_policy_execution_rules_violations():
    """Verify that grid limits deviations register as active policy violations."""
    policy = Policy(
        name="Balanced",
        objective="BALANCED",
        constraints={"voltage_deviation_pct": 5.0, "thermal_limit_pct": 90.0, "min_soc_pct": 20.0}
    )
    from app.services.policy_engine.engine import PolicyExecutionEngine
    exec_engine = PolicyExecutionEngine(None)
    
    grid_metrics = {
        "voltage_deviation_pct": 6.8,       # Violates 5.0%
        "max_thermal_loading_pct": 95.0,   # Violates 90.0%
        "battery_soc_pct": 15.0            # Violates 20.0% min SOC
    }
    violations = exec_engine.evaluate_rules(policy, grid_metrics)
    assert len(violations) == 3
    metrics_violated = [v["metric"] for v in violations]
    assert "voltage_deviation_pct" in metrics_violated
    assert "max_thermal_loading_pct" in metrics_violated
    assert "battery_soc_pct" in metrics_violated
