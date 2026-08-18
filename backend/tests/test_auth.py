import pytest
from backend.app.models import AdminUser

def test_admin_login_success(client):
    """Verifies that an admin user can log in with correct credentials."""
    response = client.post("/api/admin/login", json={
        "username": "admin",
        "password": "AdminPassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "SUPER_ADMIN"
    assert data["username"] == "admin"

def test_admin_login_wrong_credentials(client):
    """Verifies login failure with invalid password or username."""
    # Invalid password
    response = client.post("/api/admin/login", json={
        "username": "admin",
        "password": "WrongPassword"
    })
    assert response.status_code == 401
    
    # Invalid username
    response = client.post("/api/admin/login", json={
        "username": "non_existent_user",
        "password": "AdminPassword123"
    })
    assert response.status_code == 401

def test_admin_get_me(client):
    """Verifies retrieving current admin details with valid token."""
    # Login to get token
    login_resp = client.post("/api/admin/login", json={
        "username": "admin",
        "password": "AdminPassword123"
    })
    token = login_resp.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/admin/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "SUPER_ADMIN"

def test_admin_get_me_invalid_token(client):
    """Verifies request rejection for unauthorized access without token."""
    headers = {"Authorization": "Bearer invalid_token_xyz"}
    response = client.get("/api/admin/me", headers=headers)
    assert response.status_code == 401
