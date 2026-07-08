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


class TestTwoFactorAuth:
    async def test_2fa_flow_setup_enable_login_disable(self, auth_client: AsyncClient, client: AsyncClient):
        # 1. Setup 2FA
        setup_resp = await auth_client.post("/api/v1/auth/2fa/setup")
        assert setup_resp.status_code == 200
        setup_data = setup_resp.json()
        assert "secret" in setup_data
        assert "otpauth_url" in setup_data
        secret = setup_data["secret"]

        # Generate a valid TOTP code
        import pyotp
        totp = pyotp.TOTP(secret)
        code = totp.now()

        # 2. Enable 2FA with invalid code first
        enable_fail = await auth_client.post("/api/v1/auth/2fa/enable", json={"code": "000000"})
        assert enable_fail.status_code == 400

        # Enable with correct code
        enable_ok = await auth_client.post("/api/v1/auth/2fa/enable", json={"code": code})
        assert enable_ok.status_code == 200

        # Check /me shows 2FA enabled
        me_resp = await auth_client.get("/api/v1/users/me")
        assert me_resp.json()["is_2fa_enabled"] is True

        # 3. Test Login requiring 2FA
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "auth@test.com",
            "password": "TestPass123!",
        })
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        assert login_data["require_2fa"] is True
        assert "temp_token" in login_data
        temp_token = login_data["temp_token"]

        # Verify 2FA login with incorrect code
        login_2fa_fail = await client.post("/api/v1/auth/login/2fa", json={
            "temp_token": temp_token,
            "code": "111111",
        })
        assert login_2fa_fail.status_code == 400

        # Verify 2FA login with correct code
        login_2fa_ok = await client.post("/api/v1/auth/login/2fa", json={
            "temp_token": temp_token,
            "code": totp.now(),
        })
        assert login_2fa_ok.status_code == 200
        assert "access_token" in login_2fa_ok.json()

        # 4. Disable 2FA
        disable_ok = await auth_client.post("/api/v1/auth/2fa/disable", json={"code": totp.now()})
        assert disable_ok.status_code == 200

        # Check /me shows 2FA disabled
        me_resp2 = await auth_client.get("/api/v1/users/me")
        assert me_resp2.json()["is_2fa_enabled"] is False

    async def test_sms_email_2fa_flow(self, auth_client: AsyncClient, client: AsyncClient, db_session):
        # We need to make sure the user has a phone number set to initiate SMS 2FA
        # Let's update user phone number first
        update_resp = await auth_client.put("/api/v1/users/me", json={
            "full_name": "Test User",
            "phone": "+254712345678"
        })
        assert update_resp.status_code == 200

        # 1. Setup SMS 2FA
        setup_resp = await auth_client.post("/api/v1/auth/2fa/setup?method=sms")
        assert setup_resp.status_code == 200
        setup_data = setup_resp.json()
        assert setup_data["phone"] == "+254712345678"

        # Retrieve the code from DB (since it's a simulated SMS)
        from app.models.user import User
        from sqlalchemy import select
        result = await db_session.execute(select(User).where(User.email == "auth@test.com"))
        user = result.scalar_one()
        code = user.otp_code
        assert code is not None

        # 2. Enable SMS 2FA with incorrect code
        enable_fail = await auth_client.post("/api/v1/auth/2fa/enable", json={"code": "000000"})
        assert enable_fail.status_code == 400

        # Enable with correct code
        enable_ok = await auth_client.post("/api/v1/auth/2fa/enable", json={"code": code})
        assert enable_ok.status_code == 200

        # Check /me shows 2FA enabled and method is sms
        me_resp = await auth_client.get("/api/v1/users/me")
        me_data = me_resp.json()
        assert me_data["is_2fa_enabled"] is True
        assert me_data["two_factor_method"] == "sms"

        # 3. Test Login requiring 2FA
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "auth@test.com",
            "password": "TestPass123!",
        })
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        assert login_data["require_2fa"] is True
        assert login_data["method"] == "sms"
        temp_token = login_data["temp_token"]

        # Fetch the new code from DB
        await db_session.refresh(user)
        login_code = user.otp_code
        assert login_code is not None

        # Verify login
        login_2fa_ok = await client.post("/api/v1/auth/login/2fa", json={
            "temp_token": temp_token,
            "code": login_code,
        })
        assert login_2fa_ok.status_code == 200
        assert "access_token" in login_2fa_ok.json()

        # 4. Disable SMS 2FA:
        # First request a disable code
        req_code_resp = await auth_client.post("/api/v1/auth/2fa/disable/request")
        assert req_code_resp.status_code == 200

        # Get disable code from DB
        await db_session.refresh(user)
        disable_code = user.otp_code
        assert disable_code is not None

        # Verify disable
        disable_resp = await auth_client.post("/api/v1/auth/2fa/disable", json={"code": disable_code})
        assert disable_resp.status_code == 200

        # Check /me shows 2FA disabled
        me_resp2 = await auth_client.get("/api/v1/users/me")
        assert me_resp2.json()["is_2fa_enabled"] is False
