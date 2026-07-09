"""Admin router — Control panel functions for the SaaS owner."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
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
from app.models.sender_id import SenderIdRequest
from app.models.notification import Notification
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

class AdminUpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    account_type: Optional[str] = None
    plan: Optional[str] = None

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


@router.put("/users/{user_id}")
async def admin_update_user(
    user_id: uuid.UUID,
    data: AdminUpdateUserRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update tenant profile configuration parameters."""
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.email is not None:
        # Check duplicate email
        if data.email != user.email:
            dup = await db.execute(select(User).where(User.email == data.email))
            if dup.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already registered by another user.")
            user.email = data.email
    if data.phone is not None:
        user.phone = data.phone
    if data.company is not None:
        user.company = data.company
    if data.account_type is not None:
        user.account_type = data.account_type

    await db.flush()
    return {"message": "User profile updated successfully."}


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


class RejectSenderIdRequest(BaseModel):
    reason: str


@router.get("/sender-ids")
async def list_all_sender_ids(
    status_filter: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all Sender ID registration requests across the system."""
    q = select(SenderIdRequest).options(joinedload(SenderIdRequest.user)).order_by(SenderIdRequest.created_at.desc())
    if status_filter:
        q = q.where(SenderIdRequest.status == status_filter)
    res = await db.execute(q)
    requests = res.scalars().all()
    # Serialize with user email/name for clarity
    return [
        {
            "id": r.id,
            "sender_id": r.sender_id,
            "purpose": r.purpose,
            "status": r.status,
            "rejection_reason": r.rejection_reason,
            "created_at": r.created_at,
            "user_email": r.user.email if r.user else "Unknown User",
            "user_name": r.user.full_name if r.user else "Unknown"
        }
        for r in requests
    ]


@router.post("/sender-ids/{request_id}/approve")
async def approve_sender_id(
    request_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve a pending Sender ID whitelist request."""
    res = await db.execute(select(SenderIdRequest).where(SenderIdRequest.id == request_id))
    req = res.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "approved"
    req.rejection_reason = None
    
    # Notify user
    db.add(Notification(
        user_id=req.user_id,
        title="Sender ID Approved! 🎉",
        message=f"Your request for Sender ID '{req.sender_id}' has been approved by administrators.",
        type="success",
        action_url="/dashboard/sender-ids"
    ))
    await db.flush()
    return {"message": f"Sender ID {req.sender_id} approved successfully."}


@router.post("/sender-ids/{request_id}/reject")
async def reject_sender_id(
    request_id: uuid.UUID,
    data: RejectSenderIdRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject a pending Sender ID whitelist request with audit reason."""
    res = await db.execute(select(SenderIdRequest).where(SenderIdRequest.id == request_id))
    req = res.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "rejected"
    req.rejection_reason = data.reason
    
    # Notify user
    db.add(Notification(
        user_id=req.user_id,
        title="Sender ID Rejected ⚠️",
        message=f"Your request for Sender ID '{req.sender_id}' was rejected. Reason: {data.reason}",
        type="error",
        action_url="/dashboard/sender-ids"
    ))
    await db.flush()
    return {"message": f"Sender ID {req.sender_id} rejected."}


@router.get("/campaigns")
async def list_all_campaigns(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List recent campaigns sent by any user for monitoring."""
    q = select(Campaign).options(joinedload(Campaign.user)).order_by(Campaign.created_at.desc()).limit(100)
    res = await db.execute(q)
    campaigns = res.scalars().all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "sender_id": c.sender_id,
            "status": c.status,
            "total_recipients": c.total_recipients,
            "sent_count": c.sent_count,
            "failed_count": c.failed_count,
            "total_cost": c.total_cost,
            "created_at": c.created_at,
            "user_email": c.user.email if c.user else "Unknown User",
            "user_name": c.user.full_name if c.user else "Unknown"
        }
        for c in campaigns
    ]


@router.get("/transactions")
async def list_all_transactions(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List recent transactions across all tenants."""
    q = select(Transaction).options(joinedload(Transaction.user)).order_by(Transaction.created_at.desc()).limit(100)
    res = await db.execute(q)
    txs = res.scalars().all()
    return [
        {
            "id": t.id,
            "type": t.type,
            "amount": t.amount,
            "sms_credits": t.sms_credits,
            "balance_after": t.balance_after,
            "reference": t.reference,
            "description": t.description,
            "payment_method": t.payment_method,
            "status": t.status,
            "created_at": t.created_at,
            "user_email": t.user.email if t.user else "Unknown User",
            "user_name": t.user.full_name if t.user else "Unknown"
        }
        for t in txs
    ]


import json
import os

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config_settings.json")
DEFAULT_SETTINGS = {
    "mpesaPaybill": "400200",
    "mpesaTill": "900100",
    "minDeposit": 500,
    "autoCredit": True,
    "welcomeCredits": 10000,
    "baseSmsCost": 0.10,
    "senderIdFee": 10000,
    "starterRate": 1.00,
    "growthRate": 0.85,
    "enterpriseRate": 0.70,
    "maintenanceMode": False,
    "supportEmail": "support@trackom.co.ke",
    "supportPhone": "+254 700 000 000",
    "alertBanner": "",
    "advantasmsDefaultShortcode": "ARVOCAP"
}

def load_system_settings():
    if not os.path.exists(SETTINGS_FILE):
        return DEFAULT_SETTINGS.copy()
    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            merged = DEFAULT_SETTINGS.copy()
            merged.update(data)
            return merged
    except Exception:
        return DEFAULT_SETTINGS.copy()

def save_system_settings(settings):
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings, f, indent=4)
        return True
    except Exception:
        return False

class SystemSettingsUpdateRequest(BaseModel):
    mpesaPaybill: str
    mpesaTill: str
    minDeposit: int
    autoCredit: bool
    welcomeCredits: int
    baseSmsCost: float
    senderIdFee: int
    starterRate: float
    growthRate: float
    enterpriseRate: float
    maintenanceMode: bool
    supportEmail: str
    supportPhone: str
    alertBanner: str
    advantasmsDefaultShortcode: str


@router.get("/settings")
async def get_settings(admin: User = Depends(get_current_admin)):
    """Retrieve all admin settings."""
    return load_system_settings()

@router.put("/settings")
async def update_settings(
    data: SystemSettingsUpdateRequest,
    admin: User = Depends(get_current_admin)
):
    """Update system settings."""
    payload = data.model_dump()
    if save_system_settings(payload):
        return payload
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to persist system settings configurations."
    )

@router.get("/settings/public")
async def get_public_settings(current_user: User = Depends(get_current_user)):
    """Retrieve public system settings (no admin auth required)."""
    settings = load_system_settings()
    # Return only non-sensitive keys that the client needs
    return {
        "mpesaPaybill": settings.get("mpesaPaybill"),
        "mpesaTill": settings.get("mpesaTill"),
        "minDeposit": settings.get("minDeposit"),
        "baseSmsCost": settings.get("baseSmsCost"),
        "supportEmail": settings.get("supportEmail"),
        "supportPhone": settings.get("supportPhone"),
        "alertBanner": settings.get("alertBanner"),
        "maintenanceMode": settings.get("maintenanceMode"),
        "senderIdFee": settings.get("senderIdFee"),
    }
