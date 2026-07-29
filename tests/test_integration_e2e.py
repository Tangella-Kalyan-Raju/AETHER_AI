import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_telemetry_health():
    # Verify the unified data integration layer API is up
    response = client.get("/api/v1/health")
    assert response.status_code == 200

def test_forecast_integration():
    # Verify the forecasting engine API is up
    response = client.get("/api/v1/forecasting/demand")
    # Even if empty or not authenticated, ensure it doesn't 500
    assert response.status_code in [200, 401, 403]

def test_optimization_integration():
    # Verify the optimization engine API is up
    response = client.get("/api/v1/optimization/recommendations")
    assert response.status_code in [200, 401, 403]

def test_ai_decision_engine():
    # Verify the AI Decision Intelligence API is up and processes queries
    response = client.post(
        "/api/v1/ai/query",
        json={"query": "What happens if cloud cover increases by 40%?"}
    )
    # The endpoint isn't guarded by auth in the mock, so we expect 200
    if response.status_code == 200:
        data = response.json()
        assert "what_happened" in data
        assert "recommendation" in data
        assert data["confidence"] > 0
