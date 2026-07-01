"""API Key schemas."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    scope: str = Field("full_access", pattern="^(full_access|read_only|send_only)$")
    rate_limit: int = Field(60, ge=0)
    ip_whitelist: Optional[str] = Field(None, max_length=255)
    expires_at: Optional[datetime] = None


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    is_active: bool
    scope: str
    rate_limit: int
    ip_whitelist: Optional[str]
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]
    usage_count: int
    created_at: datetime
    model_config = {"from_attributes": True}


class ApiKeyCreatedResponse(ApiKeyResponse):
    """Returned only on creation — includes the full key (shown once)."""
    full_key: str
