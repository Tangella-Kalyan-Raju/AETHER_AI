import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user

class MockUser:
    username = "trainee_john"

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    yield
    app.dependency_overrides.clear()

client = TestClient(app)

def test_training_session_lifecycle():
    """Verify that a training session can be started, mentored, and graded."""
    
    # 1. Create a scenario
    payload = {
        "name": "Training Test",
        "category": "Test",
        "scenario_type": "Test",
        "severity": "Low",
        "trigger_conditions_json": {}
    }
    res = client.post("/api/v1/scenarios/build", json=payload)
    assert res.status_code == 200
    scenario_id = res.json()["id"]
    
    # 2. Start Simulation (required for training session)
    sim_res = client.post("/api/v1/simulation/start", json={"scenario_id": scenario_id, "speed_multiplier": 1.0})
    assert sim_res.status_code == 200
    sim_id = sim_res.json()["id"]
    
    # 3. Start Training Session
    train_res = client.post("/api/v1/training/sessions/start", json={"simulation_id": sim_id, "difficulty_level": "Beginner"})
    assert train_res.status_code == 200
    session_id = train_res.json()["session_id"]
    
    # 4. Get Mentor Hint
    hint_res = client.get(f"/api/v1/training/sessions/{session_id}/mentor?current_time=15")
    assert hint_res.status_code == 200
    assert "Hint:" in hint_res.json()["hint"]
    
    # 5. Submit for Grading (with 5 mock optimal actions to pass)
    actions = [
        {"action_type": "Deploy", "target_asset": "B1", "parameters": {}},
        {"action_type": "Deploy", "target_asset": "B2", "parameters": {}},
        {"action_type": "Deploy", "target_asset": "B3", "parameters": {}},
        {"action_type": "Deploy", "target_asset": "B4", "parameters": {}},
        {"action_type": "Deploy", "target_asset": "B5", "parameters": {}}
    ]
    grade_res = client.post(f"/api/v1/training/sessions/{session_id}/submit", json={"actions_taken": actions})
    assert grade_res.status_code == 200
    assert grade_res.json()["passed"] == True
    
    # 6. Verify Certification was issued
    cert_res = client.get("/api/v1/training/certifications")
    assert cert_res.status_code == 200
    assert len(cert_res.json()) > 0


def test_training_save_resume_clone():
    """Verify that training sessions can be saved, resumed, and cloned."""
    # 1. Create a scenario
    payload = {
        "name": "Save Scenario",
        "category": "Test",
        "scenario_type": "Test",
        "severity": "Low",
        "trigger_conditions_json": {}
    }
    scenario_id = client.post("/api/v1/scenarios/build", json=payload).json()["id"]
    sim_id = client.post("/api/v1/simulation/start", json={"scenario_id": scenario_id}).json()["id"]
    
    # 2. Start Session
    session_id = client.post("/api/v1/training/sessions/start", json={"simulation_id": sim_id}).json()["session_id"]
    
    # 3. Save Session
    save_res = client.post(f"/api/v1/training/sessions/{session_id}/save", json={"saved_state": {"time": 45}})
    assert save_res.status_code == 200
    assert save_res.json()["status"] == "SAVED"
    
    # 4. Resume Session
    resume_res = client.post(f"/api/v1/training/sessions/{session_id}/resume")
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "ACTIVE"
    assert resume_res.json()["saved_state"]["time"] == 45
    
    # 5. Clone Session
    clone_res = client.post(f"/api/v1/training/sessions/{session_id}/clone")
    assert clone_res.status_code == 200
    assert "cloned" in clone_res.json()["message"]
    assert clone_res.json()["session_id"] != session_id


def test_training_mentor_chat():
    """Verify conversational Q&A with the AI Training Assistant."""
    # 1. Create session
    payload = {
        "name": "Chat Scenario",
        "category": "Test",
        "scenario_type": "Test",
        "severity": "Low",
        "trigger_conditions_json": {}
    }
    scenario_id = client.post("/api/v1/scenarios/build", json=payload).json()["id"]
    sim_id = client.post("/api/v1/simulation/start", json={"scenario_id": scenario_id}).json()["id"]
    session_id = client.post("/api/v1/training/sessions/start", json={"simulation_id": sim_id}).json()["session_id"]
    
    # 2. Ask Question
    ask_res = client.post(f"/api/v1/training/sessions/{session_id}/mentor/ask", json={
        "question": "Why did the grid frequency drop?",
        "current_time": 20
    })
    assert ask_res.status_code == 200
    assert "frequency" in ask_res.json()["answer"]


def test_training_analytics_and_reports():
    """Verify analytics tracking and CSV report downloads."""
    # 1. Query empty analytics
    analytics_res = client.get("/api/v1/training/analytics")
    assert analytics_res.status_code == 200
    
    # 2. Export individual reports in CSV
    csv_res = client.get("/api/v1/training/reports/export?report_type=individual&format=csv")
    assert csv_res.status_code == 200
    assert "Session ID" in csv_res.text


def test_replay_session_lifecycle():
    """Verify creating and listing replay sessions."""
    # 1. Create scenario & simulation
    payload = {
        "name": "Replay Scenario",
        "category": "Test",
        "scenario_type": "Test",
        "severity": "Low",
        "trigger_conditions_json": {}
    }
    scenario_id = client.post("/api/v1/scenarios/build", json=payload).json()["id"]
    sim_id = client.post("/api/v1/simulation/start", json={"scenario_id": scenario_id}).json()["id"]
    
    # 2. Start Replay Session
    replay_res = client.post("/api/v1/training/replays/start", json={
        "name": "Historical Replay Run",
        "simulation_id": sim_id,
        "timeline_events": [{"time": 10, "label": "Outage"}]
      })
    assert replay_res.status_code == 200
    assert replay_res.json()["name"] == "Historical Replay Run"
    
    # 3. List Replays
    list_res = client.get("/api/v1/training/replays")
    assert list_res.status_code == 200
    assert len(list_res.json()) > 0

