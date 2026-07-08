"""Wallet & payment router."""

import uuid as uuid_mod
import secrets
from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.middleware.auth import get_current_user
from app.schemas.wallet import TopupRequest, TopupResponse, TransactionResponse

router = APIRouter(prefix="/wallet", tags=["Wallet & Payments"])


@router.get("/transactions", response_model=List[TransactionResponse])
async def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve transaction history for the authenticated user."""
    result = await db.execute(
        select(Transaction)
        .where(
            Transaction.user_id == current_user.id,
            Transaction.sandbox_mode == current_user.sandbox_mode
        )
        .order_by(Transaction.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/topup", response_model=TopupResponse)
async def mpesa_topup(
    data: TopupRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Simulate M-Pesa STK Push payment and credit user's account."""
    # Lock user row for update to prevent race conditions
    stmt = select(User).where(User.id == current_user.id).with_for_update()
    result = await db.execute(stmt)
    user = result.scalar_one()

    # Load system settings for dynamic pricing
    from app.routers.admin import load_system_settings
    settings = load_system_settings()
    base_cost = settings.get("baseSmsCost", 1.0)
    
    # Get user plan rate multiplier
    plan_key = f"{user.plan}Rate"  # e.g. starterRate, growthRate, enterpriseRate
    multiplier = settings.get(plan_key, 1.0)
    
    cost_per_credit = base_cost * multiplier
    if cost_per_credit <= 0:
        cost_per_credit = 1.0  # Avoid division by zero
        
    credits_to_add = int(data.amount / cost_per_credit)
    checkout_id = f"ws_CO_{secrets.token_hex(8)}"
    merchant_id = f"ws_MR_{secrets.token_hex(4)}"

    # Add transaction record
    tx = Transaction(
        user_id=user.id,
        type="topup",
        amount=data.amount,
        sms_credits=credits_to_add,
        balance_after=user.active_balance + credits_to_add,
        reference=f"MP_{secrets.token_hex(5).upper()}",
        description=f"M-Pesa STK push top-up ({data.phone_number})",
        payment_method="mpesa",
        status="completed",
        sandbox_mode=user.sandbox_mode,
    )
    db.add(tx)

    # Credit user balance
    user.active_balance += credits_to_add
    await db.flush()


    return TopupResponse(
        checkout_request_id=checkout_id,
        merchant_request_id=merchant_id,
        response_code="0",
        response_description="Success. STK push request accepted.",
        status="completed",
    )

