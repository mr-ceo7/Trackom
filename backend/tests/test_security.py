"""Tests for security utilities — password hashing & JWT tokens."""

import pytest
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token


class TestPasswordHashing:
    def test_hash_returns_string(self):
        h = hash_password("testpassword")
        assert isinstance(h, str)
        assert h != "testpassword"

    def test_hash_is_unique(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # Different salts

    def test_verify_correct(self):
        h = hash_password("MySecure123")
        assert verify_password("MySecure123", h) is True

    def test_verify_wrong(self):
        h = hash_password("MySecure123")
        assert verify_password("WrongPass", h) is False

    def test_verify_empty(self):
        h = hash_password("notempty")
        assert verify_password("", h) is False


class TestJWT:
    def test_access_token_roundtrip(self):
        token = create_access_token({"sub": "user-123"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["type"] == "access"

    def test_refresh_token_roundtrip(self):
        token = create_refresh_token({"sub": "user-456"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user-456"
        assert payload["type"] == "refresh"

    def test_invalid_token(self):
        assert decode_token("not.a.valid.token") is None

    def test_empty_token(self):
        assert decode_token("") is None

    def test_token_contains_expiry(self):
        token = create_access_token({"sub": "x"})
        payload = decode_token(token)
        assert "exp" in payload

    def test_access_and_refresh_differ(self):
        access = create_access_token({"sub": "same"})
        refresh = create_refresh_token({"sub": "same"})
        assert access != refresh
