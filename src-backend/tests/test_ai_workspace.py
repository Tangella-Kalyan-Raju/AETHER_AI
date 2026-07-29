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

def test_workspace_dashboard_endpoint():
    res = client.get("/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "system_status" in data
    assert "fleet_health" in data

def test_workspace_insights_endpoint():
    res = client.get("/insights")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "category" in data[0]

def test_workspace_timeline_endpoint():
    res = client.get("/timeline")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "title" in data[0]

def test_workspace_export_endpoint():
    res = client.post("/export", json={"conversation_id": "test-123", "format": "markdown"})
    assert res.status_code == 200
    data = res.json()
    assert data["format"] == "markdown"
    assert "content_base64" in data
