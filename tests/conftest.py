import os
import sys

# Force all tests to run against a separate test database
os.environ["SQLITE_DB_NAME"] = "test_gpo_auth.db"

# Ensure the src-backend directory is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src-backend"))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import init_db

# Initialize database schema and seed default data before running any tests
init_db()

@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    """Ensure dependency overrides don't leak across tests."""
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def admin_token_headers(client):
    resp = client.post("/api/auth/login", json={
        "email": "admin@gpo.gov",
        "password": "admin"
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
