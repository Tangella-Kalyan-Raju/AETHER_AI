import pytest
from datetime import datetime
from fastapi.testclient import TestClient

def test_ingest_measurements_success(client: TestClient, admin_token_headers: dict):
    payload = {
        "measurements": [
            {
                "asset_id": "gen-101",
                "asset_type": "generator",
                "measurement_type": "power",
                "value": 150.5,
                "unit": "MW",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        ]
    }
    response = client.post("/api/v1/monitoring/measurements", json=payload, headers=admin_token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["accepted"] == 1

def test_ingest_measurements_validation_failure(client: TestClient, admin_token_headers: dict):
    payload = {
        "measurements": [
            {
                "asset_id": "sub-1",
                "asset_type": "substation",
                "measurement_type": "frequency",
                "value": -50.0,  # Negative frequency should fail pydantic validation
                "unit": "Hz",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        ]
    }
    response = client.post("/api/v1/monitoring/measurements", json=payload, headers=admin_token_headers)
    assert response.status_code == 422  # Unprocessable Entity
