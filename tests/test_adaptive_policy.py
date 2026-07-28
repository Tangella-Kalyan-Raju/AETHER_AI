import pytest
from app.services.policy_engine.adaptive import AdaptivePolicyService
from app.models.grid_models import Policy

class MockDbSession:
    def __init__(self, policies=None):
        self.policies = policies or []
        self.added = []
        self.committed = False

    def add(self, instance):
        self.added.append(instance)

    def commit(self):
        self.committed = True

def test_autonomy_mode_toggles():
    """Verify that autonomy mode can be read and set within safety bounds."""
    assert AdaptivePolicyService.get_autonomy_mode() in ["MANUAL", "SEMI_AUTO", "FULLY_AUTONOMOUS"]
    
    AdaptivePolicyService.set_autonomy_mode("SEMI_AUTO")
    assert AdaptivePolicyService.get_autonomy_mode() == "SEMI_AUTO"
    
    AdaptivePolicyService.set_autonomy_mode("FULLY_AUTONOMOUS")
    assert AdaptivePolicyService.get_autonomy_mode() == "FULLY_AUTONOMOUS"
    
    with pytest.raises(ValueError):
        AdaptivePolicyService.set_autonomy_mode("INVALID_MODE")

def test_evaluate_grid_context():
    """Verify that SCADA and weather context metrics are correctly aggregated."""
    db = MockDbSession()
    context = AdaptivePolicyService.evaluate_grid_context(db)
    
    assert "weather_warning" in context
    assert context["demand_forecast_peak_mw"] > 0
    assert context["market_price_usd_mwh"] > 0

def test_generate_recommendation():
    """Verify context assessment recommends correct policy with high confidence."""
    db = MockDbSession()
    
    # Mock PolicyRepository to return a mock list of policies
    policy_list = [
        Policy(id=1, name="Balanced Mode", is_active=True, status="active"),
        Policy(id=2, name="Reliability Mode", is_active=False, status="draft")
    ]
    
    from app.repositories.grid_repository import PolicyRepository
    original_get_all = PolicyRepository.get_all
    PolicyRepository.get_all = lambda self: policy_list
    
    try:
        rec = AdaptivePolicyService.generate_recommendation(db)
        assert rec["recommended_policy_name"] == "Reliability Mode"
        assert rec["confidence_score"] >= 0.90
        assert "weather" in rec["reasoning"].lower()
    finally:
        PolicyRepository.get_all = original_get_all

def test_approve_recommendation():
    """Verify recommendation approval switches active database policy and logs transitions."""
    db = MockDbSession()
    
    policy_a = Policy(id=1, name="Balanced Mode", is_active=True, status="active")
    policy_b = Policy(id=2, name="Reliability Mode", is_active=False, status="published")
    policy_list = [policy_a, policy_b]
    
    from app.repositories.grid_repository import PolicyRepository
    original_get_all = PolicyRepository.get_all
    PolicyRepository.get_all = lambda self: policy_list
    
    try:
        # Deploy recommendation ID 1 (which maps to policy_b / Reliability Mode)
        activated_policy = AdaptivePolicyService.approve_recommendation(1, db, user_id=4)
        
        assert activated_policy.id == 2
        assert activated_policy.is_active is True
        assert activated_policy.status == "active"
        
        # Original policy should be deactivated
        assert policy_a.is_active is False
        assert policy_a.status == "published"
        assert db.committed is True
    finally:
        PolicyRepository.get_all = original_get_all

def test_get_effectiveness_analytics():
    """Verify that policy opex savings and acceptance stats are compiled."""
    db = MockDbSession()
    analytics = AdaptivePolicyService.get_effectiveness_analytics(db)
    
    assert analytics["cost_savings_usd"] > 0
    assert analytics["ai_recommendation_accuracy_pct"] > 80
    assert len(analytics["historical_improvements"]) > 0

def test_get_transitions():
    """Verify policy transition timelines audit logs list fields."""
    db = MockDbSession()
    transitions = AdaptivePolicyService.get_transitions(db)
    
    assert len(transitions) > 0
    assert "from_policy" in transitions[0]
    assert "to_policy" in transitions[0]
    assert "trigger_event" in transitions[0]
