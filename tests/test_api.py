"""
GPO Backend Test Suite — Authentication & API Foundation Tests
Path: tests/test_api.py
"""
import sys
import os
import uuid

# Ensure the src-backend directory is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src-backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import engine
from app.models.base import Base
from app.database.init_db import init_db

def unique_email(prefix="test"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}@gpo.gov"

client = TestClient(app)

# ──────────────────────────────────────────────────────────
# Health Endpoint Tests
# ──────────────────────────────────────────────────────────
def test_health_v1():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert data["data"]["service"] == "GPO API Gateway"

def test_health_legacy():
    response = client.get("/api/health")
    assert response.status_code == 200

# ──────────────────────────────────────────────────────────
# Authentication Tests
# ──────────────────────────────────────────────────────────
def test_register_new_user():
    email = unique_email("register")
    response = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "TestPass123",
        "full_name": "Test User",
        "organization": "Test Org"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == email

def test_register_duplicate_email():
    email = unique_email("dup")
    # First registration
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Pass123",
        "full_name": "Dup User",
        "organization": "Dup Org"
    })
    # Second registration with same email
    response = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Pass456",
        "full_name": "Dup User 2",
        "organization": "Dup Org 2"
    })
    assert response.status_code == 400

def test_login_success():
    email = unique_email("login")
    # Register a user first
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "LoginPass123",
        "full_name": "Login Tester",
        "organization": "GPO Corp"
    })
    # Login
    response = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "LoginPass123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

def test_login_wrong_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@gpo.gov",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_login_nonexistent_user():
    response = client.post("/api/v1/auth/login", json={
        "email": "nobody@gpo.gov",
        "password": "nopass"
    })
    assert response.status_code == 401

def test_get_current_user_me():
    # Login as admin
    login_response = client.post("/api/auth/login", json={
        "email": "admin@gpo.gov",
        "password": "admin"
    })
    token = login_response.json()["access_token"]
    
    # Get /me
    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    data = me_response.json()
    assert data.get("email") == "admin@gpo.gov" or data.get("data", {}).get("email") == "admin@gpo.gov"

def test_me_without_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401  # No credentials provided → Unauthorized

def test_me_with_invalid_token():
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalidtoken123"})
    assert response.status_code == 401

# ──────────────────────────────────────────────────────────
# Legacy Backward Compatibility Tests
# ──────────────────────────────────────────────────────────
def test_legacy_login():
    response = client.post("/api/auth/login", json={
        "email": "admin@gpo.gov",
        "password": "admin"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_legacy_register():
    email = unique_email("legacy")
    response = client.post("/api/auth/register", json={
        "email": email,
        "password": "Legacy123",
        "full_name": "Legacy User",
        "organization": "Legacy Org"
    })
    assert response.status_code == 200

# ──────────────────────────────────────────────────────────
# Error Handling Tests
# ──────────────────────────────────────────────────────────
def test_validation_error_missing_email():
    response = client.post("/api/v1/auth/login", json={
        "password": "test"
    })
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert "errors" in data

def test_404_not_found():
    response = client.post("/api/v1/nonexistent-endpoint")
    assert response.status_code in [404, 405]

# ──────────────────────────────────────────────────────────
# RBAC Authorization Tests
# ──────────────────────────────────────────────────────────
def test_admin_can_list_users():
    login_response = client.post("/api/auth/login", json={
        "email": "admin@gpo.gov",
        "password": "admin"
    })
    token = login_response.json()["access_token"]
    
    response = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

def test_viewer_cannot_list_users():
    email = unique_email("viewer")
    # Register a viewer
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "ViewerPass123",
        "full_name": "Viewer User",
        "organization": "GPO Corp",
        "role": "Viewer"
    })
    # Login as viewer
    login_response = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "ViewerPass123"
    })
    token = login_response.json()["access_token"]
    
    # Try listing users (requires admin:view)
    response = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

def test_logout():
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
