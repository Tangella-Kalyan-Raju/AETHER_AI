import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.ai.api.router import router
from app.core.security import get_current_user
from app.models.auth_models import User

app = FastAPI()
app.include_router(router)

# Override get_current_user with a Super Admin mock
app.dependency_overrides[get_current_user] = lambda: User(id=1, email="admin@gpo.com", role="Super Admin")

client = TestClient(app)

def test_list_workflows():
    res = client.get("/workflows")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "name" in data[0]

def test_create_workflow():
    payload = {"name": "Test Workflow Run", "description": "Verify workflow queue dispatcher"}
    res = client.post("/workflows", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Test Workflow Run"
    assert data["status"] == "Initiated"

def test_list_tasks():
    res = client.get("/tasks")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "title" in data[0]

def test_create_task():
    payload = {
        "title": "Verify relay operating speed",
        "description": "Trigger diagnostic secondary injection",
        "priority": "Medium",
        "assigned_team": "Maintenance East",
        "related_asset": "Sierra Feeder Relay"
    }
    res = client.post("/tasks", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Verify relay operating speed"
    assert data["status"] == "Pending"

def test_list_alerts():
    res = client.get("/alerts")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "recommended_action" in data[0]

def test_send_notification():
    payload = {
        "subject": "Critical Dispatch Approved",
        "body": "Relay speed injection test completed.",
        "recipient_group": "Grid Ops Team"
    }
    res = client.post("/notifications", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "sent"

def test_approvals_processing():
    res = client.get("/approvals")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0

    action_payload = {
        "task_id": "task-1",
        "action": "Approve",
        "comments": "Inspections approved by operator."
    }
    action_res = client.post("/approvals", json=action_payload)
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "success"

def test_audit_trail():
    res = client.get("/audit")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "action" in data[0]
