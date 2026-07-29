import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user

class MockUser:
    id = 1
    username = "builder_admin"
    email = "builder_admin@gpo.gov"
    role = "Super Admin"

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    yield
    app.dependency_overrides.clear()

client = TestClient(app)

def test_deep_scenario_build():
    """Verify that a Scenario with nested ScenarioEvents can be built and saved."""
    payload = {
        "name": "Cloud Cover Cascade",
        "description": "Multi-event cascade starting with cloud cover.",
        "category": "Weather",
        "scenario_type": "Cascade",
        "severity": "Medium",
        "status": "DRAFT",
        "trigger_conditions_json": {},
        "events": [
            {
                "event_type": "Weather",
                "start_offset_mins": 0,
                "duration_mins": 120,
                "parameters_json": {"cloud_cover": 80},
                "order_index": 0
            },
            {
                "event_type": "Demand",
                "start_offset_mins": 30,
                "duration_mins": 60,
                "parameters_json": {"load_increase": 15},
                "order_index": 1
            }
        ]
    }
    
    response = client.post("/api/v1/scenarios/build", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Cloud Cover Cascade"
    assert data["status"] == "DRAFT"
    
def test_publish_scenario():
    """Verify status transition to PUBLISHED."""
    # Build draft
    payload = {
        "name": "Draft to Publish",
        "category": "Test",
        "scenario_type": "Test",
        "severity": "Low",
        "trigger_conditions_json": {}
    }
    res = client.post("/api/v1/scenarios/build", json=payload)
    assert res.status_code == 200
    scenario_id = res.json()["id"]
    
    # Publish
    res_publish = client.put(f"/api/v1/scenarios/{scenario_id}/status?status=PUBLISHED")
    assert res_publish.status_code == 200
    assert res_publish.json()["status"] == "PUBLISHED"
