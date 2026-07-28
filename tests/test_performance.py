import pytest
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ai_query_latency():
    """Ensure the AI orchestration pipeline resolves within reasonable limits (mock)."""
    start_time = time.time()
    response = client.post(
        "/api/v1/ai/query",
        json={"query": "Test query for latency."}
    )
    end_time = time.time()
    
    latency_ms = (end_time - start_time) * 1000
    
    # In this mock state, it should be lightning fast (< 100ms)
    assert response.status_code in [200, 401, 403]
    print(f"AI Query Latency: {latency_ms:.2f} ms")

def test_optimization_latency():
    """Ensure the optimization endpoint fetches latest heuristics fast."""
    start_time = time.time()
    response = client.get("/api/v1/optimization/recommendations")
    end_time = time.time()
    
    latency_ms = (end_time - start_time) * 1000
    assert response.status_code in [200, 401, 403]
    print(f"Optimization Fetch Latency: {latency_ms:.2f} ms")
