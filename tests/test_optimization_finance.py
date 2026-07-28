import pytest
from fastapi.testclient import TestClient
from app.main import app

# Import Phase 7.3 engines
from app.services.optimization.cost_optimizer import CostOptimizationEngine
from app.services.optimization.carbon_optimizer import CarbonOptimizationEngine

client = TestClient(app)

# ── Unit Tests for Cost & Carbon Math ─────────────────────────────

def test_cost_optimization_math():
    engine = CostOptimizationEngine()
    result = engine.optimize({"load_mw": 1420.0, "fuel_price_usd_mwh": 50.0}, {})
    
    assert "economic_dispatch" in result
    assert "battery_arbitrage" in result
    assert "renewable_savings" in result
    assert "market_pricing" in result
    
    # Savings checks
    assert result["metrics"]["total_savings_usd"] > 0
    assert result["economic_dispatch"]["conventional_savings_usd"] == 320.0 * 50.0
    assert result["battery_arbitrage"]["arbitrage_savings_usd"] == (50.0 * 155.0) - (50.0 * 38.0)

def test_carbon_optimization_math():
    engine = CarbonOptimizationEngine()
    result = engine.optimize({"carbon_intensity": 180.0}, {})
    
    assert "emissions" in result
    assert "sustainability" in result
    assert "carbon_tax_credits" in result
    assert "regional_footprints" in result
    
    # Emission avoided checks
    assert result["emissions"]["co2_avoided_tons"] > 0
    assert result["carbon_tax_credits"]["tax_offset_credits_usd"] == result["emissions"]["co2_avoided_tons"] * 25.0
    assert len(result["regional_footprints"]) == 3

# ── API Integration Tests ─────────────────────────────────────────

def test_execute_financial_triggers():
    # Cost advisor execution
    cost_res = client.post("/api/v1/optimization/execute/cost-optimization")
    assert cost_res.status_code == 200
    assert "economic_dispatch" in cost_res.json()
    
    # Carbon advisor execution
    carbon_res = client.post("/api/v1/optimization/execute/carbon-optimization")
    assert carbon_res.status_code == 200
    assert "emissions" in carbon_res.json()

def test_full_pipeline_commits_financial_results():
    # 1. Register a config
    config_payload = {
        "name": "Financial Optimization Run Profile",
        "mode": "ECONOMIC"
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

    # 5. Fetch financial details
    financial_res = client.get(f"/api/v1/optimization/results/financial/{job_id}")
    assert financial_res.status_code == 200
    r = financial_res.json()
    assert r["job_id"] == job_id
    assert "cost_optimization" in r
    assert "carbon_optimization" in r
    assert r["financial_reports"]["total_savings_usd"] > 0

    # 6. Fetch historical reports
    reports_res = client.get("/api/v1/optimization/reports/cost-carbon")
    assert reports_res.status_code == 200
    report_list = reports_res.json()
    assert len(report_list) > 0
    assert any(item["job_id"] == job_id for item in report_list)
