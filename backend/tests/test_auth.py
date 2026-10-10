import pytest

def test_register_user(client):
    response = client.post("/api/auth/register", json={
        "email": "traveler1@railmate.com",
        "password": "securepassword123",
        "full_name": "Priya Patel",
        "phone": "+91 9988776655"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "traveler1@railmate.com"

def test_login_existing_demo_user(client):
    response = client.post("/api/auth/login", json={
        "email": "demo@railmate.com",
        "password": "demo123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "user"

def test_login_invalid_password(client):
    response = client.post("/api/auth/login", json={
        "email": "demo@railmate.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_get_current_user_profile(client):
    login_res = client.post("/api/auth/login", json={
        "email": "demo@railmate.com",
        "password": "demo123"
    })
    token = login_res.json()["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "demo@railmate.com"

def test_admin_access_control(client):
    # Regular user attempting admin endpoint
    user_res = client.post("/api/auth/login", json={"email": "demo@railmate.com", "password": "demo123"})
    user_token = user_res.json()["access_token"]
    admin_attempt = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {user_token}"})
    assert admin_attempt.status_code == 403

    # Admin user accessing admin endpoint
    admin_res = client.post("/api/auth/login", json={"email": "admin@railmate.com", "password": "admin123"})
    admin_token = admin_res.json()["access_token"]
    admin_success = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_success.status_code == 200
    assert "metrics" in admin_success.json()
