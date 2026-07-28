import pytest
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_optimization_foundation_lifecycle():
    """
    Verifies that solver configurations can be created, jobs enqueued,
    status polled, and execution history/logs retrieved.
    """

    # 1. Create a Solver Configuration
    config_payload = {
        "name": "Green Renewable Priority",
        "mode": "GREEN",
        "constraints": ["Frequency", "Voltage", "ThermalLimits"],
        "objectives": [
            {"name": "CostMinimization", "weight": 0.2},
            {"name": "CarbonReduction", "weight": 0.5},
            {"name": "GridStability", "weight": 0.3}
        ]
      }
    
    config_res = client.post("/api/v1/optimization/configs", json=config_payload)
    assert config_res.status_code == 201
    assert "config_id" in config_res.json()
    config_id = config_res.json()["config_id"]

    # 2. List Configs and verify
    list_configs_res = client.get("/api/v1/optimization/configs")
    assert list_configs_res.status_code == 200
    assert len(list_configs_res.json()) > 0
    assert any(c["id"] == config_id for c in list_configs_res.json())

    # 3. Create Optimization Job
    job_payload = {
        "config_id": config_id,
        "priority": "HIGH"
    }
    job_res = client.post("/api/v1/optimization/jobs", json=job_payload)
    assert job_res.status_code == 201
    assert "job_id" in job_res.json()
    job_id = job_res.json()["job_id"]

    # 4. Start Optimization Job (Starts background scheduler queue execution)
    start_res = client.post(f"/api/v1/optimization/jobs/{job_id}/start")
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "QUEUED"

    # 5. Wait a moment and Poll status to see progress
    time.sleep(2.0)
    status_res = client.get(f"/api/v1/optimization/jobs/{job_id}/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] in ["RUNNING", "COMPLETED"]

    # 6. List Jobs
    list_jobs_res = client.get("/api/v1/optimization/jobs")
    assert list_jobs_res.status_code == 200
    assert len(list_jobs_res.json()) > 0
    assert any(j["id"] == job_id for j in list_jobs_res.json())

    # 7. Check if history record is written
    history_res = client.get("/api/v1/optimization/history")
    assert history_res.status_code == 200
    
    # Locate history record for the job
    matching_hist = [h for h in history_res.json() if h["job_id"] == job_id]
    if len(matching_hist) > 0:
        history_id = matching_hist[0]["id"]
        # Retrieve logs
        logs_res = client.get(f"/api/v1/optimization/history/{history_id}/logs")
        assert logs_res.status_code == 200
        assert "logs" in logs_res.json()
        assert "Initiating Grid Optimization Pipeline" in logs_res.json()["logs"]
