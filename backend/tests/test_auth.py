"""Tests for auth endpoints."""

import pytest
from httpx import AsyncClient


class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "full_name": "John Doe",
            "email": "john@example.com",
            "password": "SecurePass1!",
            "phone": "+254712345678",
            "company": "Acme Ltd",
            "account_type": "business",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(self, client: AsyncClient):
        payload = {
            "full_name": "Jane",
            "email": "dupe@example.com",
            "password": "SecurePass1!",
            "account_type": "business",
        }
        await client.post("/api/v1/auth/register", json=payload)
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 409
        assert "already registered" in resp.json()["detail"]

    async def test_register_short_password(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "full_name": "Short",
            "email": "short@example.com",
            "password": "abc",
            "account_type": "business",
        })
        assert resp.status_code == 422  # Validation error

    async def test_register_invalid_email(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "full_name": "Bad Email",
            "email": "not-an-email",
            "password": "SecurePass1!",
            "account_type": "business",
        })
        assert resp.status_code == 422

    async def test_register_reseller(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "full_name": "Reseller User",
            "email": "reseller@example.com",
            "password": "SecurePass1!",
            "account_type": "reseller",
        })
        assert resp.status_code == 201


class TestLogin:
    async def test_login_success(self, client: AsyncClient):
        # Register first
        await client.post("/api/v1/auth/register", json={
            "full_name": "Login User",
            "email": "login@example.com",
            "password": "SecurePass1!",
            "account_type": "business",
        })
        # Login
        resp = await client.post("/api/v1/auth/login", json={
            "email": "login@example.com",
            "password": "SecurePass1!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    async def test_login_wrong_password(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "full_name": "Wrong Pass",
            "email": "wrongpass@example.com",
            "password": "SecurePass1!",
            "account_type": "business",
        })
        resp = await client.post("/api/v1/auth/login", json={
            "email": "wrongpass@example.com",
            "password": "WrongPassword!",
        })
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/login", json={
            "email": "nobody@example.com",
            "password": "whatever123",
        })
        assert resp.status_code == 401


class TestRefreshToken:
    async def test_refresh_success(self, client: AsyncClient):
        reg = await client.post("/api/v1/auth/register", json={
            "full_name": "Refresh User",
            "email": "refresh@example.com",
            "password": "SecurePass1!",
            "account_type": "business",
        })
        refresh_token = reg.json()["refresh_token"]
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_refresh_invalid_token(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": "invalid.token.here",
        })
        assert resp.status_code == 401


class TestForgotPassword:
    async def test_forgot_password_existing(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "full_name": "Forgot User",
            "email": "forgot@example.com",
            "password": "SecurePass1!",
            "account_type": "business",
        })
        resp = await client.post("/api/v1/auth/forgot-password", json={
            "email": "forgot@example.com",
        })
        assert resp.status_code == 200

    async def test_forgot_password_nonexistent(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/forgot-password", json={
            "email": "ghost@example.com",
        })
        # Should still return 200 to prevent email enumeration
        assert resp.status_code == 200


class TestUserProfile:
    async def test_get_me(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/users/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "auth@test.com"
        assert data["full_name"] == "Auth User"
        assert data["sms_balance"] == 10000
        assert data["plan"] == "starter"

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/v1/users/me")
        assert resp.status_code == 403  # No bearer token

    async def test_update_me(self, auth_client: AsyncClient):
        resp = await auth_client.put("/api/v1/users/me", json={
            "full_name": "Updated Name",
            "company": "New Corp",
        })
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Updated Name"
        assert resp.json()["company"] == "New Corp"

    async def test_change_password(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/users/me/change-password", json={
            "current_password": "TestPass123!",
            "new_password": "NewSecure456!",
        })
        assert resp.status_code == 200


class TestHealthCheck:
    async def test_health(self, client: AsyncClient):
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["app"] == "Trackom API"
