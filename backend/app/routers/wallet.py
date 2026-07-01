"""Wallet & payment router."""

import uuid as uuid_mod
import secrets
from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve transaction history for the authenticated user."""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
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

    # 1 KES = 10 SMS credits
    credits_to_add = int(data.amount * 10)
    checkout_id = f"ws_CO_{secrets.token_hex(8)}"
    merchant_id = f"ws_MR_{secrets.token_hex(4)}"

    # Add transaction record
    tx = Transaction(
        user_id=user.id,
        type="topup",
        amount=data.amount,
        sms_credits=credits_to_add,
        balance_after=user.sms_balance + credits_to_add,
        reference=f"MP_{secrets.token_hex(5).upper()}",
        description=f"M-Pesa STK push top-up ({data.phone_number})",
        payment_method="mpesa",
        status="completed",
    )
    db.add(tx)

    # Credit user balance
    user.sms_balance += credits_to_add
    await db.flush()

    return TopupResponse(
        checkout_request_id=checkout_id,
        merchant_request_id=merchant_id,
        response_code="0",
        response_description="Success. STK push request accepted.",
        status="completed",
    )

