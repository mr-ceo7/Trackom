"""Wallet & payment router."""

import uuid as uuid_mod
import secrets
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
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
    """Simulate M-Pesa STK Push in sandbox, or initiate real payment in live mode."""
    # Lock user row for update to prevent race conditions
    stmt = select(User).where(User.id == current_user.id).with_for_update()
    result = await db.execute(stmt)
    user = result.scalar_one()

    # Use user's credit_rate directly
    cost_per_credit = float(user.credit_rate)
    if cost_per_credit <= 0:
        cost_per_credit = 1.0  # Avoid division by zero
        
    credits_to_add = int(data.amount / cost_per_credit)

    if user.sandbox_mode:
        # --- SANDBOX MODE: Simulate immediate success ---
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
            response_description="Success. Sandbox STK push completed instantly.",
            status="completed",
            transaction_id=tx.id,
        )
    else:
        # --- LIVE MODE: Trigger real Safaricom Daraja API ---
        from app.services.mpesa import initiate_mpesa_stk
        
        # We generate a unique transaction ID reference for our tracking
        reference_code = f"TRK{secrets.token_hex(4).upper()}"
        try:
            mpesa_res = await initiate_mpesa_stk(
                phone=data.phone_number,
                amount=data.amount,
                reference=reference_code
            )
            checkout_id = mpesa_res.get("CheckoutRequestID")
            merchant_id = mpesa_res.get("MerchantRequestID")
            response_code = mpesa_res.get("ResponseCode", "0")
            response_desc = mpesa_res.get("ResponseDescription", "STK push initiated successfully.")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to initiate live M-Pesa STK Push: {str(e)}"
            )

        # Save a pending transaction mapping to CheckoutRequestID
        tx = Transaction(
            user_id=user.id,
            type="topup",
            amount=data.amount,
            sms_credits=credits_to_add,
            balance_after=user.active_balance,  # Balance remains unchanged until callback completes
            reference=checkout_id,  # Map to checkout request ID for query in callback
            description=f"Live M-Pesa STK push initiated to {data.phone_number}",
            payment_method="mpesa",
            status="pending",
            sandbox_mode=user.sandbox_mode,
        )
        db.add(tx)
        await db.flush()

        return TopupResponse(
            checkout_request_id=checkout_id,
            merchant_request_id=merchant_id,
            response_code=response_code,
            response_description=response_desc,
            status="pending",
            transaction_id=tx.id,
        )



@router.post("/mpesa/callback")
async def mpesa_callback(
    request: Request,
    secret: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Callback webhook for Safaricom Daraja M-Pesa STK Push payment results."""
    from app.config import get_settings
    settings = get_settings()

    # Optional signature/secret check
    if settings.MPESA_CALLBACK_SECRET and secret != settings.MPESA_CALLBACK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid callback secret."
        )

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body.")

    stk_callback = body.get("Body", {}).get("stkCallback", {})
    checkout_request_id = stk_callback.get("CheckoutRequestID")
    result_code = stk_callback.get("ResultCode")
    result_desc = stk_callback.get("ResultDesc")

    if not checkout_request_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing CheckoutRequestID.")

    # Find the corresponding pending transaction
    tx_q = select(Transaction).where(
        Transaction.reference == checkout_request_id,
        Transaction.status == "pending"
    )
    res = await db.execute(tx_q)
    tx = res.scalar_one_or_none()

    if not tx:
        return {"status": "ignored", "message": "No matching pending transaction found."}

    if result_code == 0:
        # STK request was successful! Safaricom verified payment
        meta = stk_callback.get("CallbackMetadata", {}).get("Item", [])
        receipt = next((item["Value"] for item in meta if item["Name"] == "MpesaReceiptNumber"), None)

        # Lock user to avoid concurrent balance update race conditions
        user_q = select(User).where(User.id == tx.user_id).with_for_update()
        user_res = await db.execute(user_q)
        user = user_res.scalar_one()

        # Update transaction status and active balance
        tx.status = "completed"
        if receipt:
            tx.reference = receipt
        tx.description = f"Live M-Pesa STK push completed. Receipt: {receipt}"
        tx.balance_after = user.sms_balance + tx.sms_credits

        # Add credits to user's live balance
        user.sms_balance += tx.sms_credits

        # Add success notification
        from app.models.notification import Notification
        db.add(Notification(
            user_id=user.id,
            title="Wallet Credited! 💳",
            message=f"Received KES {tx.amount} successfully via M-Pesa. Added {tx.sms_credits} credits to your live wallet.",
            type="success",
            action_url="/dashboard/wallet",
            sandbox_mode=False
        ))

        await db.commit()
        
        # Publish real-time success event
        try:
            from app.services.event_bus import event_bus
            event_bus.publish(str(user.id), "wallet_update", {
                "sms_balance": user.active_balance,
                "message": f"Added {tx.sms_credits} credits to your live wallet.",
                "type": "success"
            })
        except Exception:
            pass

        return {"status": "success", "message": f"Successfully completed topup for user: {user.email}"}
    else:
        # STK failed (cancelled by user, timeout, wrong PIN, etc.)
        tx.status = "failed"
        tx.description = f"M-Pesa STK payment failed: {result_desc} (Code: {result_code})"

        from app.models.notification import Notification
        db.add(Notification(
            user_id=tx.user_id,
            title="Payment Request Failed ❌",
            message=f"M-Pesa payment failed: {result_desc}",
            type="error",
            action_url="/dashboard/wallet",
            sandbox_mode=False
        ))

        await db.commit()

        # Publish real-time failure event
        try:
            from app.services.event_bus import event_bus
            event_bus.publish(str(tx.user_id), "wallet_update", {
                "sms_balance": None,
                "message": f"M-Pesa payment failed: {result_desc}",
                "type": "failed"
            })
        except Exception:
            pass

        return {"status": "failed", "message": f"Transaction marked as failed: {result_desc}"}


