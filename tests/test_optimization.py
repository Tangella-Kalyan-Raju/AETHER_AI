import pytest
from app.services.optimization.constraint_engine import GridConstraintValidator
from app.services.optimization.strategies import GreenModeOptimizer
from app.services.optimization.manager import OptimizationManager

def test_grid_constraint_validator():
    validator = GridConstraintValidator(None)
    is_valid, reason = validator.validate("Test Strategy", {"battery_discharge_mw": 500})
    # Since current SOC mock is 250, 500 should fail
    assert is_valid is False
    assert "exceeds current SOC" in reason

def test_green_mode_optimizer():
    opt = GreenModeOptimizer()
    forecast = {"solar_mw": 1000, "wind_mw": 500, "demand_mw": 2000}
    # Gap is 500, battery max is 250
    result = opt.optimize({}, forecast)
    assert result["actions"]["battery_discharge_mw"] == 250
    assert result["actions"]["curtailment_mw"] == 0

def test_green_mode_curtailment():
    opt = GreenModeOptimizer()
    forecast = {"solar_mw": 2000, "wind_mw": 500, "demand_mw": 2000}
    # Supply > Demand by 500
    result = opt.optimize({}, forecast)
    assert result["actions"]["battery_discharge_mw"] == 0
    assert result["actions"]["curtailment_mw"] == 500
