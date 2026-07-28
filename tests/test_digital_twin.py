"""
GPO Backend Test Suite — Digital Twin & Topology Endpoints
Path: tests/test_digital_twin.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src-backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_digital_twin_summary():
    # Login as admin to get the token
    login_response = client.post("/api/auth/login", json={
        "email": "admin@gpo.gov",
        "password": "admin"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # Query summary
    response = client.get("/api/v1/digital-twin/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Assert metrics exist (use >= to handle accumulated test data in shared DB)
    metrics = data["data"]["metrics"]
    assert metrics["total_substations"] >= 1
    assert metrics["total_buses"] >= 1
    assert "total_transmission_lines" in metrics
    assert "total_transformers" in metrics
    assert "total_generators" in metrics
    assert "total_loads" in metrics
    assert "asset_validation_status" in metrics
    assert "database_synchronization_status" in metrics
    assert "topology_completeness" in metrics

    # Assert topology lists exist
    topology = data["data"]["topology"]
    assert isinstance(topology["substations"], list)
    assert isinstance(topology["buses"], list)
    assert isinstance(topology["transmission_lines"], list)
    assert isinstance(topology["transformers"], list)
    assert isinstance(topology["generators"], list)
    assert isinstance(topology["loads"], list)
    assert isinstance(topology["switches"], list)

    # Assert recent events key exists
    assert "recent_events" in data["data"]
