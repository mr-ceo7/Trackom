"""Admin router — Control panel functions for the SaaS owner."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import uuid
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.campaign import Campaign
from app.models.sms import SmsMessage
from app.models.transaction import Transaction
from app.models.gateway import SmsGateway
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Control Panel"])

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required."
        )
    return current_user

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_campaigns: int
    total_sms_sent: int
    success_rate: float
    system_balance: int

class AdminUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    phone: Optional[str]
    full_name: str
    company: Optional[str]
    account_type: str
    plan: str
    sms_balance: int
    is_active: bool
    is_verified: bool
    is_superuser: bool
    credit_rate: float
    created_at: datetime

    model_config = {"from_attributes": True}

class UpdateCreditsRequest(BaseModel):
    amount: int
    description: Optional[str] = "Manual credit adjustment by administrator."

class UpdateUserStatusRequest(BaseModel):
    is_active: bool

class UpdateUserRateRequest(BaseModel):
    credit_rate: float

class AdminGatewayResponse(BaseModel):
    id: uuid.UUID
    name: str
    api_url: str
    api_key: str
    weight: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class CreateGatewayRequest(BaseModel):
    name: str
    api_url: str
    api_key: str
    weight: int
    is_active: bool = True


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Total Users
    res_users = await db.execute(select(func.count(User.id)))
    total_users = res_users.scalar() or 0

    res_active = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    active_users = res_active.scalar() or 0

    # Total Campaigns
    res_campaigns = await db.execute(select(func.count(Campaign.id)))
    total_campaigns = res_campaigns.scalar() or 0

    # Total SMS Sent
    res_sms = await db.execute(select(func.count(SmsMessage.id)))
    total_sms_sent = res_sms.scalar() or 0

    # Success rate
    res_delivered = await db.execute(
        select(func.count(SmsMessage.id)).where(SmsMessage.status == "delivered")
    )
    delivered_count = res_delivered.scalar() or 0
    success_rate = (delivered_count / total_sms_sent * 100) if total_sms_sent > 0 else 100.0

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_campaigns=total_campaigns,
        total_sms_sent=total_sms_sent,
        success_rate=round(success_rate, 2),
        system_balance=10000000
    )


@router.get("/users", response_model=List[AdminUserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    q = select(User).order_by(User.created_at.desc())
    if search:
        q = q.where(User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%") | User.company.ilike(f"%{search}%"))
    
    q = q.offset((page - 1) * limit).limit(limit)
    res = await db.execute(q)
    return res.scalars().all()


@router.post("/users/{user_id}/credits")
async def update_user_credits(
    user_id: uuid.UUID,
    data: UpdateCreditsRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_balance = user.sms_balance
    user.sms_balance = max(0, user.sms_balance + data.amount)
    
    # Record transaction log
    transaction = Transaction(
        user_id=user.id,
        type="bonus" if data.amount > 0 else "refund",
        amount=0.0,
        sms_credits=data.amount,
        balance_after=user.sms_balance,
        reference=f"ADMIN-{uuid.uuid4().hex[:8].upper()}",
        description=data.description,
        payment_method="system",
        status="completed"
    )
    db.add(transaction)
    await db.flush()
    
    return {"message": "Credits updated successfully", "old_balance": old_balance, "new_balance": user.sms_balance}


@router.post("/users/{user_id}/status")
async def update_user_status(
    user_id: uuid.UUID,
    data: UpdateUserStatusRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = data.is_active
    await db.flush()
    return {"message": "User status updated successfully", "is_active": user.is_active}


@router.post("/users/{user_id}/rate")
async def update_user_rate(
    user_id: uuid.UUID,
    data: UpdateUserRateRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.credit_rate = data.credit_rate
    await db.flush()
    return {"message": "User credit rate updated successfully", "credit_rate": user.credit_rate}


@router.get("/gateways", response_model=List[AdminGatewayResponse])
async def list_gateways(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all SMS gateway API configurations."""
    res = await db.execute(select(SmsGateway).order_by(SmsGateway.created_at.desc()))
    return res.scalars().all()


@router.post("/gateways")
async def create_or_update_gateway(
    data: CreateGatewayRequest,
    gateway_id: Optional[uuid.UUID] = Query(None),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new SMS gateway configuration, or update it if gateway_id is provided."""
    if gateway_id:
        res = await db.execute(select(SmsGateway).where(SmsGateway.id == gateway_id))
        gateway = res.scalar_one_or_none()
        if not gateway:
            raise HTTPException(status_code=404, detail="Gateway not found")
        
        gateway.name = data.name
        gateway.api_url = data.api_url
        gateway.api_key = data.api_key
        gateway.weight = data.weight
        gateway.is_active = data.is_active
    else:
        gateway = SmsGateway(
            name=data.name,
            api_url=data.api_url,
            api_key=data.api_key,
            weight=data.weight,
            is_active=data.is_active
        )
        db.add(gateway)
    
    await db.flush()
    return {"message": "SMS Gateway updated successfully"}


@router.delete("/gateways/{gateway_id}")
async def delete_gateway(
    gateway_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete an SMS gateway configuration."""
    res = await db.execute(select(SmsGateway).where(SmsGateway.id == gateway_id))
    gateway = res.scalar_one_or_none()
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway not found")
    
    await db.delete(gateway)
    await db.flush()
    return {"message": "Gateway configuration deleted successfully"}
