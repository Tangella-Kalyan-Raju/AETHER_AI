import sys
import os
import uuid as uuid_lib
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src-backend"))

# Use separate test database for automated runs
os.environ["SQLITE_DB_NAME"] = "test_gpo_auth.db"

from app.main import app

client = TestClient(app)

def get_admin_token() -> str:
    """Login as admin and return the Bearer token."""
    resp = client.post("/api/auth/login", json={
        "email": "admin@gpo.gov",
        "password": "admin"
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return resp.json()["access_token"]

def auth_headers() -> dict:
    return {"Authorization": f"Bearer {get_admin_token()}"}

def unique_name(prefix: str) -> str:
    return f"{prefix}-{uuid_lib.uuid4().hex[:8]}"

def test_substation_optimistic_concurrency():
    headers = auth_headers()
    sub_name = unique_name("Sierra-Sync")

    # 1. Create asset - should initialize version to 1
    resp = client.post("/api/v1/substations", headers=headers, json={
        "name": sub_name,
        "description": "Optimistic concurrency test substation",
        "latitude": 38.0,
        "longitude": -120.0,
    })
    assert resp.status_code == 201, f"Creation failed: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    substation = data["data"]
    sub_id = substation["id"]
    assert substation["version"] == 1

    # 2. Update with correct version (version=1) -> Should succeed and increment version to 2
    resp_update1 = client.put(f"/api/v1/substations/{sub_id}", headers=headers, json={
        "name": sub_name,
        "description": "First successful update",
        "version": 1
    })
    assert resp_update1.status_code == 200, f"Update failed: {resp_update1.text}"
    substation = resp_update1.json()["data"]
    assert substation["version"] == 2

    # 3. Simulate conflict: Update again with stale version=1 -> Should return 409 Conflict
    resp_conflict = client.put(f"/api/v1/substations/{sub_id}", headers=headers, json={
        "name": sub_name,
        "description": "Stale update trigger",
        "version": 1
    })
    assert resp_conflict.status_code == 409, f"Expected 409 conflict but got: {resp_conflict.text}"
    conflict_data = resp_conflict.json()
    assert conflict_data["success"] is False
    # The 409 response envelope has the message at the top level
    assert "Conflict detected" in conflict_data.get("message", "")

    # 4. Update with correct current version (version=2) -> Should succeed and increment to 3
    resp_update2 = client.put(f"/api/v1/substations/{sub_id}", headers=headers, json={
        "name": sub_name,
        "description": "Correction update",
        "version": 2
    })
    assert resp_update2.status_code == 200, f"Expected success but got: {resp_update2.text}"
    substation = resp_update2.json()["data"]
    assert substation["version"] == 3
