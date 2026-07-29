import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user

class MockUser:
    id = 1
    username = "sim_operator"
    email = "sim_operator@gpo.gov"
    role = "Super Admin"

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    yield
    app.dependency_overrides.clear()

client = TestClient(app)

def test_start_simulation():
    """Verify that a simulation run can be started and stopped."""
    # We would need a valid scenario_id here in a real integration test, 
    # but we can test the failure case or mock it.
    
    # Let's create a scenario first
    payload = {
        "name": "Sim Test",
        "category": "Test",
        "scenario_type": "Test",
        "severity": "Low",
        "trigger_conditions_json": {}
    }
    res = client.post("/api/v1/scenarios/build", json=payload)
    assert res.status_code == 200
    scenario_id = res.json()["id"]
    
    # Start Simulation
    sim_res = client.post("/api/v1/simulation/start", json={"scenario_id": scenario_id, "speed_multiplier": 10.0})
    assert sim_res.status_code == 200
    sim_id = sim_res.json()["id"]
    
    # Get State
    state_res = client.get(f"/api/v1/simulation/{sim_id}/state")
    assert state_res.status_code == 200
    assert "current_time" in state_res.json()
    
    # Stop Simulation
    stop_res = client.post(f"/api/v1/simulation/{sim_id}/stop")
    assert stop_res.status_code == 200
