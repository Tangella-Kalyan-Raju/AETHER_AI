import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal
from app.models.scenario_models import ScenarioTemplate
from app.core.security import get_current_user

class MockUser:
    id = 1
    username = "scenario_admin"
    email = "scenario_admin@gpo.gov"
    role = "Super Admin"

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    yield
    app.dependency_overrides.clear()

client = TestClient(app)

def test_get_scenarios():
    """Verify that scenarios are returned correctly."""
    response = client.get("/api/v1/scenarios/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_scenario_validation_rejection():
    """Verify validation engine catches bad severity."""
    bad_payload = {
        "name": "Invalid Scenario",
        "category": "Demand",
        "scenario_type": "Spike",
        "severity": "Apocalyptic", # Invalid
        "trigger_conditions_json": {}
    }
    
    response = client.post("/api/v1/scenarios/", json=bad_payload)
    assert response.status_code == 400
    resp_body = response.json()
    assert "Invalid severity" in resp_body.get("detail", "") or "Invalid severity" in resp_body.get("message", "")
