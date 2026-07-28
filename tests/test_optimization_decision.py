import pytest
from fastapi.testclient import TestClient
from app.main import app

# Import Phase 7.4 engines
from app.services.optimization.multi_objective import MultiObjectiveEngine
from app.services.optimization.trade_off import TradeOffAnalyzer
from app.services.optimization.comparison import StrategyComparator
from app.services.optimization.what_if import WhatIfEngine
from app.services.optimization.sensitivity import SensitivityAnalyzer

client = TestClient(app)

# ── Unit Tests for Multi-Objective Solvers ────────────────────────

def test_multi_objective_fitness_score():
    engine = MultiObjectiveEngine()
    grid = {"overall_score": 85.0}
    cost = {"metrics": {"total_savings_usd": 22500.0}}
    carbon = {"emissions": {"co2_avoided_tons": 25.0}}
    weights = {"stability": 0.3, "cost": 0.3, "carbon": 0.2, "reliability": 0.2}

    score = engine.evaluate_fitness(grid, cost, carbon, weights)
    assert 0.0 <= score <= 100.0
    assert score > 0.0

def test_trade_off_analyzer_matrix():
    analyzer = TradeOffAnalyzer()
    strategies = [
        {"name": "Cost First"},
        {"name": "Carbon First"},
        {"name": "Balanced"}
    ]
    tradeoffs = analyzer.analyze_tradeoffs(strategies)
    assert "Cost First" in tradeoffs
    assert "Carbon First" in tradeoffs
    assert "Balanced" in tradeoffs
    assert tradeoffs["Cost First"]["impacts"]["financial"] == "EXCELLENT"

def test_strategy_comparator_profiles():
    comparator = StrategyComparator()
    strategies = comparator.generate_alternative_strategies({}, {}, {})
    assert len(strategies) == 6
    assert any(s["name"] == "Balanced" for s in strategies)
    assert any(s["name"] == "Emergency Strategy" for s in strategies)

def test_what_if_sandbox_projections():
    engine = WhatIfEngine()
    
    # Test solar drop
    res_solar = engine.evaluate_what_if("solar_drop", -25.0, {})
    assert res_solar["projected"]["risk_level"] == "HIGH" or res_solar["projected"]["risk_level"] == "MODERATE"
    assert "renewable solar generation" in res_solar["ai_projected_recommendation"]

    # Test battery increase
    res_bat = engine.evaluate_what_if("battery_increase", 15.0, {})
    assert res_bat["projected"]["grid_stability_score"] > 88.0

def test_sensitivity_gradients():
    analyzer = SensitivityAnalyzer()
    sens = analyzer.calculate_sensitivities({})
    assert len(sens) == 4
    assert sens[0]["input_variable"] == "Demand Forecast"
    assert sens[0]["impact_gradient"] == "HIGH"

# ── API Integration Tests ─────────────────────────────────────────

def test_execute_decision_endpoints():
    # Multi-objective advisory solve
    res_mo = client.post("/api/v1/optimization/execute/multi-objective")
    assert res_mo.status_code == 200
    assert "decision_fitness_score" in res_mo.json()

    # What-if sandbox run
    res_wi = client.post("/api/v1/optimization/execute/what-if?situation=solar_drop&value_change_pct=-25.0")
    assert res_wi.status_code == 200
    assert "projected" in res_wi.json()

    # Scenario optimization run
    res_so = client.post("/api/v1/optimization/execute/scenario-optimization?scenario=High Demand")
    assert res_so.status_code == 200
    assert len(res_so.json()["strategies"]) == 6

def test_full_pipeline_commits_decision_results():
    # 1. Register a config
    config_payload = {
        "name": "Decision Optimization Run Profile",
        "mode": "BALANCED"
    }
    config_res = client.post("/api/v1/optimization/configs", json=config_payload)
    assert config_res.status_code == 201
    config_id = config_res.json()["config_id"]

    # 2. Register job
    job_payload = {
        "config_id": config_id,
        "priority": "HIGH"
    }
    job_res = client.post("/api/v1/optimization/jobs", json=job_payload)
    assert job_res.status_code == 201
    job_id = job_res.json()["job_id"]

    # 3. Start job
    start_res = client.post(f"/api/v1/optimization/jobs/{job_id}/start")
    assert start_res.status_code == 200

    # 4. Sleep to allow execution pipeline to commit
    import time
    time.sleep(3.0)

    # 5. Fetch decision details
    decision_res = client.get(f"/api/v1/optimization/results/decisions/{job_id}")
    assert decision_res.status_code == 200
    r = decision_res.json()
    assert r["job_id"] == job_id
    assert "strategies" in r
    assert "trade_offs" in r
    assert r["ai_recommendation"]["selected_strategy"] == "Balanced"

    # 6. Fetch report export
    report_res = client.get(f"/api/v1/optimization/reports/decision/{job_id}/export")
    assert report_res.status_code == 200
    r_export = report_res.json()
    assert r_export["job_id"] == job_id
    assert "csv_export" in r_export
