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

def test_analytics_dashboard_endpoint():
    res = client.get("/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "grid_efficiency" in data
    assert "system_reliability_score" in data

def test_trends_endpoint():
    res = client.get("/trends")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "dimension" in data[0]

def test_kpis_endpoint():
    res = client.get("/kpis")
    assert res.status_code == 200
    data = res.json()
    assert "grid_availability" in data

def test_root_cause_endpoint():
    res = client.get("/root-cause")
    assert res.status_code == 200
    data = res.json()
    assert "primary_cause" in data

def test_comparison_endpoint():
    res = client.get("/comparison")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "region" in data[0]

def test_risks_endpoint():
    res = client.get("/risks")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "risk_type" in data[0]

def test_forecast_insights_endpoint():
    res = client.get("/forecast-insights")
    assert res.status_code == 200
    data = res.json()
    assert "demand_shift_reason" in data

def test_operational_insights_endpoint():
    res = client.get("/operational-insights")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0

def test_executive_report_endpoint():
    res = client.get("/executive-report")
    assert res.status_code == 200
    data = res.json()
    assert "kpi_overview" in data

def test_export_analytics_report_endpoint():
    payload = {"report_type": "kpi", "format": "pdf"}
    res = client.post("/export-report", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["report_type"] == "kpi"
    assert "content_base64" in data
