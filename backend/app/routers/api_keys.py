"""API Keys router — generate and manage API keys."""

import uuid as uuid_mod
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.api_key import ApiKey
from app.models.api_key_log import ApiKeyLog
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


@router.get("/{key_id}/stats")
async def get_key_stats(
    key_id: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        key_uuid = uuid_mod.UUID(key_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid API key ID format.")

    key_res = await db.execute(
        select(ApiKey).where(ApiKey.id == key_uuid, ApiKey.user_id == current_user.id)
    )
    key = key_res.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    try:
        start_date = datetime.strptime(start, "%Y-%m-%d") if start else datetime.utcnow() - timedelta(days=6)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = datetime.strptime(end, "%Y-%m-%d").replace(hour=23, minute=59, second=59) if end else datetime.utcnow()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # 1. Total Requests
    req_res = await db.execute(
        select(func.count(ApiKeyLog.id))
        .where(ApiKeyLog.api_key_id == key_uuid, ApiKeyLog.created_at.between(start_date, end_date))
    )
    total_requests = req_res.scalar() or 0

    # 2. Credits Spent
    cred_res = await db.execute(
        select(func.sum(ApiKeyLog.credits))
        .where(ApiKeyLog.api_key_id == key_uuid, ApiKeyLog.created_at.between(start_date, end_date))
    )
    total_credits = float(cred_res.scalar() or 0.0)

    # 3. Success Rate
    success_res = await db.execute(
        select(func.count(ApiKeyLog.id))
        .where(
            ApiKeyLog.api_key_id == key_uuid,
            ApiKeyLog.created_at.between(start_date, end_date),
            ApiKeyLog.status >= 200,
            ApiKeyLog.status < 300
        )
    )
    success_count = success_res.scalar() or 0
    success_rate = (success_count / total_requests * 100) if total_requests > 0 else 100.0

    # 4. Daily stats (database-agnostic Python aggregation for reliability)
    logs_res = await db.execute(
        select(ApiKeyLog)
        .where(ApiKeyLog.api_key_id == key_uuid, ApiKeyLog.created_at.between(start_date, end_date))
        .order_by(ApiKeyLog.created_at.desc())
    )
    all_logs = logs_res.scalars().all()

    days_diff = (end_date.date() - start_date.date()).days + 1
    daily_map = {}
    for i in range(days_diff):
        day = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_map[day] = {"date": day, "requests": 0, "credits": 0.0}

    for log in all_logs:
        day_str = log.created_at.strftime("%Y-%m-%d")
        if day_str in daily_map:
            daily_map[day_str]["requests"] += 1
            daily_map[day_str]["credits"] += float(log.credits)

    chart_data = sorted(list(daily_map.values()), key=lambda x: x["date"])

    # Recent 10 logs
    recent_logs = []
    for log in all_logs[:10]:
        recent_logs.append({
            "timestamp": log.created_at.isoformat(),
            "endpoint": log.endpoint,
            "method": log.method,
            "status": log.status,
            "credits": float(log.credits),
            "ip": log.ip_address or "Unknown"
        })

    return {
        "total_requests": total_requests,
        "total_credits": total_credits,
        "success_rate": success_rate,
        "chart_data": chart_data,
        "recent_logs": recent_logs
    }
