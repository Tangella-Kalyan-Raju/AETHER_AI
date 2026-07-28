import pytest
from fastapi.testclient import TestClient
from app.main import app

# Import all Phase 7.2 sub-engines
from app.services.optimization.load_balancing import LoadBalancingEngine
from app.services.optimization.power_flow import PowerFlowOptimizer
from app.services.optimization.battery import BatteryOptimizationEngine
from app.services.optimization.renewable import RenewableOptimizationEngine
from app.services.optimization.peak_shaving import PeakShavingEngine
from app.services.optimization.demand_response import DemandResponseEngine
from app.services.optimization.reserve_margin import ReserveMarginOptimizer
from app.services.optimization.stability import GridStabilityOptimizer

client = TestClient(app)

# ── Unit Tests for Solver Mathematics ─────────────────────────────

def test_load_balancing_variance_reduction():
    engine = LoadBalancingEngine()
    result = engine.optimize({}, {})
    
    assert "feeders" in result
    assert "metrics" in result
    assert result["metrics"]["imbalance_index_after"] < result["metrics"]["imbalance_index_before"]
    assert result["metrics"]["overloaded_assets_count_after"] == 0

def test_power_flow_congestion_resolution():
    optimizer = PowerFlowOptimizer()
    result = optimizer.optimize({}, {})
    
    assert "transmission_lines" in result
    assert "bus_voltages" in result
    assert result["metrics"]["active_losses_mw_after"] < result["metrics"]["active_losses_mw_before"]
    
    # Check that voltage profile improved
    for bus in result["bus_voltages"]:
        assert bus["voltage_pu_after"] >= bus["voltage_pu_before"] or bus["voltage_pu_before"] > 1.0

def test_battery_charge_discharge_soc():
    engine = BatteryOptimizationEngine()
    result = engine.optimize({}, {})
    
    assert len(result["battery_schedules"]) > 0
    b = result["battery_schedules"][0]
    
    # 24 hour action and SOC lists
    assert len(b["hourly_schedule_mw"]) == 24
    assert len(b["hourly_soc_pct"]) == 24
    assert b["throughput_mwh"] > 0

def test_renewable_penetration_increase():
    engine = RenewableOptimizationEngine()
    result = engine.optimize({}, {})
    
    m = result["metrics"]
    assert m["total_curtailment_after_mw"] < m["total_curtailment_before_mw"]
    assert m["clean_energy_penetration_after_pct"] > m["clean_energy_penetration_before_pct"]

def test_peak_shaving_curve_trimming():
    engine = PeakShavingEngine()
    result = engine.optimize({}, {})
    
    m = result["metrics"]
    assert m["peak_demand_after_mw"] < m["peak_demand_before_mw"]
    assert max(result["hourly_load_profile"]["shaved_mw"]) < max(result["hourly_load_profile"]["unshaved_mw"])

def test_demand_response_load_shifting():
    engine = DemandResponseEngine()
    result = engine.optimize({}, {})
    
    assert result["metrics"]["achieved_reduction_mw"] > 0
    assert result["metrics"]["demand_shift_energy_mwh"] > 0

def test_reserve_margin_contingency():
    optimizer = ReserveMarginOptimizer()
    result = optimizer.optimize({}, {})
    
    assert result["metrics"]["current_total_reserve_mw"] > 0
    assert "spinning_reserve_mw" in result["reserve_allocation"]

def test_grid_stability_score():
    optimizer = GridStabilityOptimizer()
    result = optimizer.optimize({}, {})
    
    m = result["metrics"]
    assert m["stability_score_after"] > m["stability_score_before"]
    assert result["stability_indicators"]["frequency_deviation_hz_after"] < result["stability_indicators"]["frequency_deviation_hz_before"]

# ── API Integration Tests ─────────────────────────────────────────

def test_execute_modular_solvers_endpoints():
    endpoints = [
        "load-balancing",
        "power-flow",
        "battery",
        "renewable",
        "peak-shaving",
        "demand-response",
        "reserve-margin",
        "stability"
    ]
    
    for ep in endpoints:
        res = client.post(f"/api/v1/optimization/execute/{ep}")
        assert res.status_code == 200
        assert "metrics" in res.json()

def test_full_pipeline_history_and_results():
    # 1. Register a config
    config_payload = {
        "name": "Full Operational Run Profile",
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

    # 3. Start job (runs full 11-stage pipeline in background thread)
    start_res = client.post(f"/api/v1/optimization/jobs/{job_id}/start")
    assert start_res.status_code == 200

    # 4. Wait a moment and fetch details from grid_optimization_results table
    import time
    time.sleep(3.0)
    
    results_res = client.get(f"/api/v1/optimization/results/{job_id}")
    assert results_res.status_code == 200
    r = results_res.json()
    assert r["job_id"] == job_id
    assert r["overall_score"] > 0
    assert "load_balancing" in r
    assert "power_flow" in r
    assert "battery_schedules" in r
    assert "ai_explanation" in r
