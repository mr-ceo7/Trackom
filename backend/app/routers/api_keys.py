"""API Keys router — generate and manage API keys."""

import uuid as uuid_mod
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.api_key import ApiKey
from app.models.user import User
from app.middleware.auth import get_current_user
from app.schemas.api_keys import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.utils.security import hash_password

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.get("", response_model=List[ApiKeyResponse])
async def list_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == current_user.id).order_by(ApiKey.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_key(
    data: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    full_key = ApiKey.generate_key()
    key_prefix = full_key[:8]
    hashed = hash_password(full_key)

    api_key = ApiKey(
        user_id=current_user.id,
        name=data.name,
        key_prefix=key_prefix,
        hashed_key=hashed,
        is_active=True,
        scope=data.scope,
        rate_limit=data.rate_limit,
        ip_whitelist=data.ip_whitelist,
        expires_at=data.expires_at,
        max_credits=data.max_credits,
        is_sandbox=data.is_sandbox,
    )
    db.add(api_key)
    await db.flush()

    # Return with full_key (shown once only)
    resp = ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=key_prefix,
        is_active=True,
        scope=api_key.scope,
        rate_limit=api_key.rate_limit,
        ip_whitelist=api_key.ip_whitelist,
        expires_at=api_key.expires_at,
        max_credits=api_key.max_credits,
        is_sandbox=api_key.is_sandbox,
        last_used_at=None,
        usage_count=0,
        created_at=api_key.created_at,
        full_key=full_key,
    )
    return resp


@router.delete("/{key_id}", status_code=204)
async def revoke_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == uuid_mod.UUID(key_id), ApiKey.user_id == current_user.id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.is_active = False
