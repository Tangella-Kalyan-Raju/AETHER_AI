import os
# Use separate test database for automated runs
os.environ["SQLITE_DB_NAME"] = "test_gpo_auth.db"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Helper to get a valid token
def get_admin_token() -> str:
    resp = client.post("/api/auth/login", json={
        "email": "admin@gpo.gov",
        "password": "admin"
    })
    return resp.json()["access_token"]

def test_get_regions_unauthorized():
    response = client.get("/api/v1/engineering/regions")
    # Because there is no token, should be 403 or 401 depending on PermissionGuard
    assert response.status_code in [401, 403]

def test_get_regions_authorized():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/engineering/regions", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_assets_with_filters():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/engineering/assets?type=generator&status=active", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for asset in data:
        assert asset["asset_type"] == "generator"
        assert asset["status"] == "active"

def test_get_weather():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/engineering/weather?region_id=region-1", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for profile in data:
        assert profile["region_id"] == "region-1"
