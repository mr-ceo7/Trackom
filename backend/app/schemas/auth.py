"""Auth and User schemas."""

import uuid
from datetime import datetime
from typing import Optional

import re
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

def validate_password_complexity(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", value):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", value):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", value):
        raise ValueError("Password must contain at least one digit")
    return value


# ── Auth Requests ──

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    account_type: str = Field("business", pattern="^(business|reseller)$")
    parent_id: Optional[uuid.UUID] = None

    @field_validator('password')
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password_complexity(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator('new_password')
    @classmethod
    def check_new_password(cls, v: str) -> str:
        return validate_password_complexity(v)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── Auth Responses ──

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    onboarding_required: bool = False


# ── User ──

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    phone: Optional[str]
    full_name: str
    company: Optional[str]
    avatar_url: Optional[str]
    account_type: str
    plan: str
    sms_balance: int
    is_active: bool
    is_verified: bool
    is_superuser: bool
    webhook_url: Optional[str] = None
    is_2fa_enabled: bool = False
    two_factor_method: str = "totp"
    sandbox_mode: bool = True
    created_at: datetime
    custom_logo_url: Optional[str] = None
    custom_brand_name: Optional[str] = None
    custom_primary_color: Optional[str] = None
    branding: Optional[dict] = None
    notification_preferences: Optional[dict] = None

    model_config = {"from_attributes": True}

    @model_validator(mode='before')
    @classmethod
    def resolve_sandbox_balance(cls, data):
        if not isinstance(data, dict) and hasattr(data, 'sandbox_mode'):
            d = {}
            for field in cls.model_fields.keys():
                if hasattr(data, field):
                    d[field] = getattr(data, field)
            d['sms_balance'] = data.sandbox_sms_balance if data.sandbox_mode else data.sms_balance
            return d
        return data




class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = None
    webhook_url: Optional[str] = None
    account_type: Optional[str] = Field(None, pattern="^(business|reseller)$")
    notification_preferences: Optional[dict] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator('new_password')
    @classmethod
    def check_new_password(cls, v: str) -> str:
        return validate_password_complexity(v)


class LoginResponse(BaseModel):
    require_2fa: bool = False
    temp_token: Optional[str] = None
    method: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = "bearer"


class Login2FaRequest(BaseModel):
    temp_token: str
    code: str


class TwoFactorSetupResponse(BaseModel):
    secret: Optional[str] = None
    otpauth_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class TwoFactorCodeRequest(BaseModel):
    code: str

