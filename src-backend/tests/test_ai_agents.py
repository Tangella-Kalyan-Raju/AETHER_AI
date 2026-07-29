import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.ai.api.agents import router
from app.core.security import get_current_user
from app.models.auth_models import User

app = FastAPI()
app.include_router(router)

# Override get_current_user to return Super Admin mock bypass
app.dependency_overrides[get_current_user] = lambda: User(id=1, email="admin@gpo.com", role="Super Admin")

client = TestClient(app)

def test_list_agents():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "role" in data[0]

def test_agents_status():
    res = client.get("/status")
    assert res.status_code == 200
    data = res.json()
    assert "Asset Intelligence Agent" in data

def test_list_active_tasks():
    res = client.get("/tasks")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0

def test_run_planner_chat():
    payload = {"query": "Check load warnings for West substation"}
    res = client.post("/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["participating_agents"]) > 0
    assert "final_recommendation" in data

def test_create_agent_plan():
    payload = {"objective": "Optimize generator Dispatch"}
    res = client.post("/plan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["steps"]) > 0

def test_agents_history():
    res = client.get("/history")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0

def test_agents_monitoring_metrics():
    res = client.get("/monitoring")
    assert res.status_code == 200
    data = res.json()
    assert "total_planner_runs" in data

def test_approve_agent_task():
    payload = {"task_id": "agt-1", "action": "Approve"}
    res = client.post("/approve", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "success"

def test_reject_agent_task():
    payload = {"task_id": "agt-1", "action": "Reject"}
    res = client.post("/reject", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "success"

def test_get_agents_dashboard_summary():
    res = client.get("/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "success_rate_pct" in data
