"""Reseller router — sub-user management and credits distribution for resellers."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import uuid
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.sms import SmsMessage
from app.models.transaction import Transaction
from app.models.sender_id import SenderIdRequest
from app.middleware.auth import get_current_user
from app.utils.security import hash_password

router = APIRouter(prefix="/reseller", tags=["Reseller Panel"])

async def get_current_reseller(current_user: User = Depends(get_current_user)) -> User:
    if current_user.account_type != "reseller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Reseller account required."
        )
    return current_user

class ResellerStatsResponse(BaseModel):
    total_clients: int
    total_sms_sent: int
    reseller_balance: int

class ResellerUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    phone: Optional[str]
    full_name: str
    company: Optional[str]
    plan: str
    sms_balance: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class CreateSubUserRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    password: str = Field(..., min_length=8)

class TransferCreditsRequest(BaseModel):
    amount: int = Field(..., gt=0)

class ResellerMessageResponse(BaseModel):
    id: uuid.UUID
    recipient: str
    content: str
    sender_id: Optional[str]
    status: str
    cost: float
    user_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/stats", response_model=ResellerStatsResponse)
async def get_reseller_stats(
    reseller: User = Depends(get_current_reseller),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve reseller platform statistics."""
    # Clients count
    res_clients = await db.execute(select(func.count(User.id)).where(User.parent_id == reseller.id))
    total_clients = res_clients.scalar() or 0

    # Total SMS sent by child users
    res_sms = await db.execute(
        select(func.count(SmsMessage.id))
        .join(User, SmsMessage.user_id == User.id)
        .where(User.parent_id == reseller.id)
    )
    total_sms_sent = res_sms.scalar() or 0

    return ResellerStatsResponse(
        total_clients=total_clients,
        total_sms_sent=total_sms_sent,
        reseller_balance=reseller.sms_balance
    )


@router.get("/users", response_model=List[ResellerUserResponse])
async def list_reseller_users(
    reseller: User = Depends(get_current_reseller),
    db: AsyncSession = Depends(get_db)
):
    """List all business accounts created under this reseller."""
    q = select(User).where(User.parent_id == reseller.id).order_by(User.created_at.desc())
    res = await db.execute(q)
    return res.scalars().all()


@router.post("/users", response_model=ResellerUserResponse)
async def create_reseller_user(
    data: CreateSubUserRequest,
    reseller: User = Depends(get_current_reseller),
    db: AsyncSession = Depends(get_db)
):
    """Create a new child business account under this reseller."""
    # Check if email is unique
    existing_user_result = await db.execute(select(User).where(User.email == data.email))
    if existing_user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    sub_user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        company=data.company,
        account_type="business",
        plan="starter",
        sms_balance=0,  # Starts with zero credits; reseller transfers credits manually
        is_active=True,
        is_verified=True,
        parent_id=reseller.id
    )
    db.add(sub_user)
    await db.flush()

    # Seed default approved 'TRACKOM' Sender ID
    db.add(SenderIdRequest(
        user_id=sub_user.id,
        sender_id="TRACKOM",
        purpose="System Default Sender ID",
        status="approved"
    ))
    return sub_user


@router.post("/users/{user_id}/credits")
async def transfer_credits(
    user_id: uuid.UUID,
    data: TransferCreditsRequest,
    reseller: User = Depends(get_current_reseller),
    db: AsyncSession = Depends(get_db)
):
    """Transfer SMS credits from reseller's wallet to a child user account."""
    # Lock reseller for update to avoid balance race conditions
    reseller_stmt = select(User).where(User.id == reseller.id).with_for_update()
    reseller_res = await db.execute(reseller_stmt)
    reseller_lock = reseller_res.scalar_one()

    if reseller_lock.sms_balance < data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient credits. You have {reseller_lock.sms_balance} credits remaining."
        )

    # Fetch child user
    user_res = await db.execute(select(User).where(User.id == user_id, User.parent_id == reseller.id))
    child = user_res.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child account not found under your reseller tree.")

    # Deduct from reseller
    reseller_lock.sms_balance -= data.amount

    # Add transaction log for reseller (withdrawal/transfer)
    reseller_tx = Transaction(
        user_id=reseller.id,
        type="sms_send",
        amount=0.0,
        sms_credits=-data.amount,
        balance_after=reseller_lock.sms_balance,
        reference=f"TX-{uuid.uuid4().hex[:8].upper()}",
        description=f"Transferred credits to child account: {child.email}",
        payment_method="system",
        status="completed"
    )
    db.add(reseller_tx)

    # Add to child
    child.sms_balance += data.amount

    # Add transaction log for child (deposit/topup)
    child_tx = Transaction(
        user_id=child.id,
        type="topup",
        amount=0.0,
        sms_credits=data.amount,
        balance_after=child.sms_balance,
        reference=f"RX-{uuid.uuid4().hex[:8].upper()}",
        description=f"Received credit allocation from reseller: {reseller.email}",
        payment_method="system",
        status="completed"
    )
    db.add(child_tx)

    await db.flush()
    return {"message": "Credits transferred successfully", "transferred": data.amount, "reseller_balance": reseller_lock.sms_balance, "client_balance": child.sms_balance}


@router.get("/history", response_model=List[ResellerMessageResponse])
async def reseller_history(
    reseller: User = Depends(get_current_reseller),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve real-time SMS messages sent by all users of this reseller."""
    q = (
        select(
            SmsMessage.id,
            SmsMessage.recipient,
            SmsMessage.content,
            SmsMessage.sender_id,
            SmsMessage.status,
            SmsMessage.cost,
            User.full_name.label("user_name"),
            SmsMessage.created_at
        )
        .join(User, SmsMessage.user_id == User.id)
        .where(User.parent_id == reseller.id)
        .order_by(SmsMessage.created_at.desc())
        .limit(100)
    )
    result = await db.execute(q)
    return result.all()


class EditSubUserRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    credit_rate: Optional[float] = None
    is_active: Optional[bool] = None

class ResellerBrandingRequest(BaseModel):
    custom_logo_url: Optional[str] = None
    custom_brand_name: Optional[str] = None
    custom_primary_color: Optional[str] = None


@router.put("/users/{user_id}", response_model=ResellerUserResponse)
async def update_sub_user(
    user_id: uuid.UUID,
    data: EditSubUserRequest,
    reseller: User = Depends(get_current_reseller),
    db: AsyncSession = Depends(get_db)
):
    """Update a sub-user's details, credit rate, or active status."""
    result = await db.execute(select(User).where(User.id == user_id, User.parent_id == reseller.id))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child account not found under your reseller tree.")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(child, field, value)
    
    await db.commit()
    return child


@router.put("/branding")
async def update_branding(
    data: ResellerBrandingRequest,
    reseller: User = Depends(get_current_reseller),
    db: AsyncSession = Depends(get_db)
):
    """Update the reseller's custom white-label branding settings."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reseller, field, value)
    
    await db.commit()
    return {
        "message": "Branding updated successfully",
        "custom_logo_url": reseller.custom_logo_url,
        "custom_brand_name": reseller.custom_brand_name,
        "custom_primary_color": reseller.custom_primary_color
    }
