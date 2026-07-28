import pytest
from app.services.policy_engine.simulation import PolicySimulationService
from app.models.grid_models import Policy

def test_simulate_policy_storm_weather():
    """Verify that storm weather increases operating costs and reduces reliability KPIs."""
    policy = Policy(
        name="Economic Mode",
        objective="MIN_COST",
        weights={"cost": 0.80, "carbon": 0.05, "stability": 0.10, "reliability": 0.05},
        constraints={"voltage_deviation_pct": 10.0}
    )
    
    sim = PolicySimulationService.simulate_policy(policy, "Storm Weather")
    assert sim["policy_name"] == "Economic Mode"
    assert sim["operating_cost_usd"] > 145000.0 # Cost increases under storm
    assert sim["reliability_score"] < 80.0     # Reliability drops due to low weight (0.05)

def test_simulate_policy_high_solar():
    """Verify high solar yield increases clean energy penetration."""
    policy = Policy(
        name="Green Mode",
        objective="MAX_RENEWABLES",
        weights={"cost": 0.20, "carbon": 0.60, "stability": 0.10, "reliability": 0.10},
        constraints={"min_soc_pct": 25.0}
    )
    
    sim = PolicySimulationService.simulate_policy(policy, "High Renewable")
    assert sim["renewable_penetration_pct"] > 70.0
    assert sim["operating_cost_usd"] < 145000.0 # Cost is lower due to solar offset

def test_compare_policies():
    """Verify comparative simulation calculates deltas correctly."""
    policy_a = Policy(
        name="Economic Mode",
        objective="MIN_COST",
        weights={"cost": 0.80, "stability": 0.10, "reliability": 0.10}
    )
    policy_b = Policy(
        name="Reliability Mode",
        objective="MAX_RELIABILITY",
        weights={"cost": 0.05, "stability": 0.45, "reliability": 0.50}
    )
    
    comp = PolicySimulationService.compare_policies(policy_a, policy_b, "Storm Weather")
    assert comp["deltas"]["operating_cost_usd"] > 0    # Reliability Mode cost is higher than Economic Mode cost
    assert comp["deltas"]["reliability_score"] > 0      # Reliability Mode has better reliability score

def test_assess_risks():
    """Verify risk levels are correctly assigned based on policy weights and scenarios."""
    safe_policy = Policy(
        name="Reliability Mode",
        weights={"reliability": 0.50, "stability": 0.45, "cost": 0.05}
    )
    risky_policy = Policy(
        name="Economic Mode",
        weights={"reliability": 0.05, "stability": 0.05, "cost": 0.90}
    )
    
    risk_safe = PolicySimulationService.assess_risks(safe_policy, "Storm Weather")
    risk_risky = PolicySimulationService.assess_risks(risky_policy, "Storm Weather")
    
    assert risk_safe["risk_level"] == "Moderate"
    assert risk_risky["risk_level"] in ["High", "Critical"]
    assert len(risk_risky["mitigations"]) > 0

def test_ai_evaluation():
    """Verify AI generates correct policy recommendations for a storm scenario."""
    policy_a = Policy(
        name="Economic Mode",
        objective="MIN_COST",
        weights={"cost": 0.80, "stability": 0.10, "reliability": 0.10}
    )
    policy_b = Policy(
        name="Reliability Mode",
        objective="MAX_RELIABILITY",
        weights={"cost": 0.05, "stability": 0.45, "reliability": 0.50}
    )
    
    ai_eval = PolicySimulationService.generate_ai_evaluation("Storm Weather", policy_a, policy_b)
    assert ai_eval["recommended_strategy"] == "Reliability Mode"
    assert ai_eval["confidence_score"] > 0.70
    assert "Reliability margins" in ai_eval["reasoning"]
