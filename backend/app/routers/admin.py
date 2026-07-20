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
from app.models.sender_id import SenderIdRequest, AdvantaSenderId
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

class MonthlyBreakdownItem(BaseModel):
    month: str
    revenue: float

class DailyVolumeItem(BaseModel):
    label: str
    volume: int

class DailyRevenueItem(BaseModel):
    label: str
    revenue: float

class ClientDistributionItem(BaseModel):
    client_name: str
    sms_balance: int

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    online_users: int
    today_users: int
    yesterday_users: int
    last_7d_users: int
    total_gateways: int
    active_gateways: int
    monthly_revenue: float
    today_revenue: float
    yesterday_revenue: float
    all_time_revenue: float
    this_year_revenue: float
    monthly_breakdown: List[MonthlyBreakdownItem]
    daily_volumes: List[DailyVolumeItem]
    daily_revenue_breakdown: List[DailyRevenueItem]
    client_distributions: List[ClientDistributionItem]
    total_sms_sent: int
    total_campaigns: int
    success_rate: float
    delivered_sms_count: int
    failed_sms_count: int
    pending_sms_count: int
    total_client_credits: int
    paying_clients: int
    pending_sender_ids: int
    active_campaigns: int
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
    is_superuser: Optional[bool] = None

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
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_yesterday = start_of_today - timedelta(days=1)
    start_of_7d = start_of_today - timedelta(days=7)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 1. Total Clients
    res_users = await db.execute(select(func.count(User.id)))
    total_users = res_users.scalar() or 0

    res_active = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    active_users = res_active.scalar() or 0

    res_today_users = await db.execute(select(func.count(User.id)).where(User.created_at >= start_of_today))
    today_users = res_today_users.scalar() or 0

    res_yest_users = await db.execute(
        select(func.count(User.id)).where((User.created_at >= start_of_yesterday) & (User.created_at < start_of_today))
    )
    yesterday_users = res_yest_users.scalar() or 0

    res_7d_users = await db.execute(select(func.count(User.id)).where(User.created_at >= start_of_7d))
    last_7d_users = res_7d_users.scalar() or 0

    # 1.1 Clients online (any activity in the last 10 minutes)
    ten_minutes_ago = now - timedelta(minutes=10)
    res_online = await db.execute(
        select(func.count(User.id))
        .where((User.is_active == True) & (User.updated_at >= ten_minutes_ago))
    )
    online_users = res_online.scalar() or 0

    # 1.2 Total client credits
    res_client_credits = await db.execute(select(func.sum(User.sms_balance)).where(User.is_superuser == False))
    total_client_credits = int(res_client_credits.scalar() or 0)

    # 1.25 Client credit distributions
    res_dist = await db.execute(
        select(User.full_name, User.sms_balance)
        .where(User.is_superuser == False)
        .order_by(User.sms_balance.desc())
    )
    client_distributions = []
    for full_name, bal in res_dist.all():
        client_distributions.append(ClientDistributionItem(
            client_name=full_name,
            sms_balance=bal
        ))

    # 1.3 Total paying clients (unique clients with completed topups)
    res_paying = await db.execute(
        select(func.count(func.distinct(Transaction.user_id)))
        .where((Transaction.type == "topup") & (Transaction.status == "completed"))
    )
    paying_clients = res_paying.scalar() or 0

    # 1.4 Pending whitelist sender id requests
    res_pending_sender_ids = await db.execute(
        select(func.count(SenderIdRequest.id)).where(SenderIdRequest.status == "pending")
    )
    pending_sender_ids = res_pending_sender_ids.scalar() or 0

    # 1.5 Active campaigns count
    res_active_campaigns = await db.execute(
        select(func.count(Campaign.id)).where(Campaign.status == "sending")
    )
    active_campaigns = res_active_campaigns.scalar() or 0

    # 2. Gateways
    res_gw = await db.execute(select(func.count(SmsGateway.id)))
    total_gateways = res_gw.scalar() or 0
    res_active_gw = await db.execute(select(func.count(SmsGateway.id)).where(SmsGateway.is_active == True))
    active_gateways = res_active_gw.scalar() or 0

    # 2.5 Campaigns
    res_campaigns = await db.execute(select(func.count(Campaign.id)))
    total_campaigns = res_campaigns.scalar() or 0

    # 3. Revenue
    # Monthly topups
    res_monthly_rev = await db.execute(
        select(func.sum(Transaction.amount))
        .where((Transaction.type == "topup") & (Transaction.status == "completed") & (Transaction.created_at >= start_of_month))
    )
    monthly_revenue = float(res_monthly_rev.scalar() or 0)

    # Today topups
    res_today_rev = await db.execute(
        select(func.sum(Transaction.amount))
        .where((Transaction.type == "topup") & (Transaction.status == "completed") & (Transaction.created_at >= start_of_today))
    )
    today_revenue = float(res_today_rev.scalar() or 0)

    # Yesterday topups
    res_yest_rev = await db.execute(
        select(func.sum(Transaction.amount))
        .where((Transaction.type == "topup") & (Transaction.status == "completed") & (Transaction.created_at >= start_of_yesterday) & (Transaction.created_at < start_of_today))
    )
    yesterday_revenue = float(res_yest_rev.scalar() or 0)

    # All-time revenue
    res_all_time_rev = await db.execute(
        select(func.sum(Transaction.amount))
        .where((Transaction.type == "topup") & (Transaction.status == "completed"))
    )
    all_time_revenue = float(res_all_time_rev.scalar() or 0)

    # This year revenue
    start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    res_year_rev = await db.execute(
        select(func.sum(Transaction.amount))
        .where((Transaction.type == "topup") & (Transaction.status == "completed") & (Transaction.created_at >= start_of_year))
    )
    this_year_revenue = float(res_year_rev.scalar() or 0)

    # Monthly breakdown breakdown list
    monthly_breakdown = []
    for i in range(3):
        m_start = (start_of_month - timedelta(days=i*30)).replace(day=1)
        # Next month start
        if m_start.month == 12:
            m_end = m_start.replace(year=m_start.year + 1, month=1)
        else:
            m_end = m_start.replace(month=m_start.month + 1)
        
        res_m = await db.execute(
            select(func.sum(Transaction.amount))
            .where((Transaction.type == "topup") & (Transaction.status == "completed") & (Transaction.created_at >= m_start) & (Transaction.created_at < m_end))
        )
        amt = float(res_m.scalar() or 0)
        monthly_breakdown.append(MonthlyBreakdownItem(
            month=m_start.strftime("%B %Y"),
            revenue=amt
        ))

    # Daily volumes for the past 7 days (including today)
    daily_volumes = []
    for i in range(6, -1, -1):
        day_start = start_of_today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        res_day = await db.execute(
            select(func.count(SmsMessage.id))
            .where((SmsMessage.created_at >= day_start) & (SmsMessage.created_at < day_end))
        )
        vol = res_day.scalar() or 0
        daily_volumes.append(DailyVolumeItem(
            label=day_start.strftime("%a"),
            volume=vol
        ))

    # Daily revenue for last 7 days
    daily_revenue_breakdown = []
    for i in range(6, -1, -1):
        day_start = start_of_today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        res_day_rev = await db.execute(
            select(func.sum(Transaction.amount))
            .where((Transaction.type == "topup") & (Transaction.status == "completed") & (Transaction.created_at >= day_start) & (Transaction.created_at < day_end))
        )
        day_rev = float(res_day_rev.scalar() or 0)
        # Format label: "Today", "Yesterday", or "Mon 05"
        if i == 0:
            day_label = "Today"
        elif i == 1:
            day_label = "Yesterday"
        else:
            day_label = day_start.strftime("%a %d")
        daily_revenue_breakdown.append(DailyRevenueItem(label=day_label, revenue=day_rev))

    # 4. SMS Delivery Rate
    res_sms_sent = await db.execute(select(func.count(SmsMessage.id)))
    total_sms_sent = res_sms_sent.scalar() or 0

    res_delivered = await db.execute(select(func.count(SmsMessage.id)).where(SmsMessage.status == "delivered"))
    delivered_sms_count = res_delivered.scalar() or 0

    res_failed = await db.execute(select(func.count(SmsMessage.id)).where(SmsMessage.status == "failed"))
    failed_sms_count = res_failed.scalar() or 0

    res_pending = await db.execute(select(func.count(SmsMessage.id)).where(SmsMessage.status.in_(["queued", "scheduled"])))
    pending_sms_count = res_pending.scalar() or 0

    success_rate = (delivered_sms_count / total_sms_sent * 100) if total_sms_sent > 0 else 100.0

    # System balance from gateway check
    from app.services.sms_gateway import AdvantaSMSGateway
    gateway = AdvantaSMSGateway()
    system_balance = 10000000  # Default fallback
    try:
        balance_data = await gateway.check_balance(timeout=2.0)
        if balance_data and "credit" in balance_data:
            system_balance = int(float(balance_data["credit"]))
    except Exception:
        pass

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        online_users=online_users,
        today_users=today_users,
        yesterday_users=yesterday_users,
        last_7d_users=last_7d_users,
        total_gateways=total_gateways,
        active_gateways=active_gateways,
        monthly_revenue=monthly_revenue,
        today_revenue=today_revenue,
        yesterday_revenue=yesterday_revenue,
        all_time_revenue=all_time_revenue,
        this_year_revenue=this_year_revenue,
        monthly_breakdown=monthly_breakdown,
        daily_volumes=daily_volumes,
        daily_revenue_breakdown=daily_revenue_breakdown,
        client_distributions=client_distributions,
        total_sms_sent=total_sms_sent,
        total_campaigns=total_campaigns,
        success_rate=round(success_rate, 2),
        delivered_sms_count=delivered_sms_count,
        failed_sms_count=failed_sms_count,
        pending_sms_count=pending_sms_count,
        total_client_credits=total_client_credits,
        paying_clients=paying_clients,
        pending_sender_ids=pending_sender_ids,
        active_campaigns=active_campaigns,
        system_balance=system_balance
    )


class AdminEventItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    created_at: datetime

@router.get("/events", response_model=List[AdminEventItem])
async def list_admin_events(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Fetch last 5 signups
    res_users = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(5)
    )
    users = res_users.scalars().all()
    
    # Fetch last 5 sender ID requests
    res_senders = await db.execute(
        select(SenderIdRequest).options(joinedload(SenderIdRequest.user)).order_by(SenderIdRequest.created_at.desc()).limit(5)
    )
    senders = res_senders.scalars().all()
    
    # Fetch last 5 campaigns
    res_campaigns = await db.execute(
        select(Campaign).options(joinedload(Campaign.user)).order_by(Campaign.created_at.desc()).limit(5)
    )
    campaigns = res_campaigns.scalars().all()

    # Fetch last 5 completed top-up transactions
    res_transactions = await db.execute(
        select(Transaction).options(joinedload(Transaction.user))
        .where((Transaction.type == "topup") & (Transaction.status == "completed"))
        .order_by(Transaction.created_at.desc()).limit(5)
    )
    transactions = res_transactions.scalars().all()
    
    events = []
    
    # Combine signups
    for u in users:
        events.append(AdminEventItem(
            id=f"user-{u.id}",
            type="signup",
            title="New user signup",
            description=f"Tenant {u.full_name} ({u.email}) registered successfully.",
            created_at=u.created_at
        ))
        
    # Combine sender ID requests
    for s in senders:
        user_name = s.user.full_name if s.user else "Unknown Tenant"
        events.append(AdminEventItem(
            id=f"sender-{s.id}",
            type="sender_id",
            title="Alphanumeric Whitelist Request",
            description=f"Tenant '{user_name}' requested whitelisting of Sender ID: {s.sender_id}.",
            created_at=s.created_at
        ))
        
    # Combine campaigns
    for c in campaigns:
        user_name = c.user.full_name if c.user else "Unknown Tenant"
        events.append(AdminEventItem(
            id=f"campaign-{c.id}",
            type="campaign",
            title="Campaign Dispatch Started",
            description=f"Tenant '{user_name}' initiated dispatch for campaign '{c.name}'.",
            created_at=c.created_at
        ))

    # Combine transactions
    for t in transactions:
        user_name = t.user.full_name if t.user else "Unknown Tenant"
        events.append(AdminEventItem(
            id=f"transaction-{t.id}",
            type="topup",
            title="Credits Purchased 💰",
            description=f"Tenant '{user_name}' purchased {t.sms_credits:,} credits (KES {t.amount:,}) via {t.payment_method or 'M-Pesa'}.",
            created_at=t.created_at
        ))
        
    # Sort events by created_at descending
    events.sort(key=lambda e: e.created_at, reverse=True)
    
    # Return top 10 events
    return events[:10]


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
    if data.is_superuser is not None:
        user.is_superuser = data.is_superuser

    await db.flush()
    return {"message": "User profile updated successfully."}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Permanently delete a user account and all associated data."""
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin self-deletion
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account.")
        
    await db.delete(user)
    await db.flush()
    return {"message": "User and all associated data deleted successfully."}


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


class AssignSenderIdRequest(BaseModel):
    user_id: uuid.UUID
    sender_id: str
    purpose: Optional[str] = "Assigned by Administrator"


@router.get("/sender-ids/advanta")
async def list_advanta_sender_ids(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all Advanta approved sender IDs."""
    res = await db.execute(select(AdvantaSenderId).order_by(AdvantaSenderId.sender_id.asc()))
    return res.scalars().all()


@router.post("/sender-ids/assign")
async def assign_sender_id(
    data: AssignSenderIdRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Assign an Advanta approved Sender ID to a client."""
    sender_upper = data.sender_id.upper().strip()
    
    # 1. Verify User exists
    res_user = await db.execute(select(User).where(User.id == data.user_id))
    user = res_user.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 2. Verify Sender ID exists in Advanta approved list
    res_adv = await db.execute(
        select(AdvantaSenderId).where(AdvantaSenderId.sender_id == sender_upper)
    )
    adv_sender = res_adv.scalar_one_or_none()
    if not adv_sender:
        raise HTTPException(
            status_code=400, 
            detail=f"Sender ID '{sender_upper}' is not in the Advanta-approved list."
        )
        
    # 3. Check if user already has this sender ID assigned
    res_exist = await db.execute(
        select(SenderIdRequest).where(
            (SenderIdRequest.user_id == data.user_id) & 
            (SenderIdRequest.sender_id == sender_upper)
        )
    )
    existing = res_exist.scalars().all()
    
    has_sandbox = any(e.sandbox_mode for e in existing)
    has_live = any(not e.sandbox_mode for e in existing)
    
    # Create approved sender ID request for both sandbox and live modes if not existing
    modes_to_create = []
    if not has_sandbox:
        modes_to_create.append(True)
    if not has_live:
        modes_to_create.append(False)
        
    for sandbox_mode in modes_to_create:
        req = SenderIdRequest(
            user_id=data.user_id,
            sender_id=sender_upper,
            purpose=data.purpose or "Assigned by Administrator",
            status="approved",
            sandbox_mode=sandbox_mode
        )
        db.add(req)
        
    # 4. Notify user
    db.add(Notification(
        user_id=data.user_id,
        title="New Sender ID Assigned! 📱",
        message=f"Administrator has assigned the Sender ID '{sender_upper}' to your account.",
        type="success",
        action_url="/dashboard/compose"
    ))
    
    await db.flush()
    return {"message": f"Sender ID '{sender_upper}' successfully assigned to {user.full_name}."}


@router.delete("/sender-ids/{request_id}")
async def delete_user_sender_id(
    request_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete/Revoke an assigned or approved Sender ID from a user."""
    res = await db.execute(select(SenderIdRequest).where(SenderIdRequest.id == request_id))
    req = res.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Sender ID request/assignment not found.")

    sender_id = req.sender_id
    user_id = req.user_id

    await db.delete(req)
    
    # Notify user that their Sender ID has been revoked
    db.add(Notification(
        user_id=user_id,
        title="Sender ID Revoked 🚫",
        message=f"Administrator has revoked the Sender ID '{sender_id}' from your account.",
        type="warning",
        action_url="/dashboard/sender-ids"
    ))
    
    await db.flush()
    return {"message": f"Sender ID '{sender_id}' successfully removed from user."}


class CreateAdvantaSenderIdRequest(BaseModel):
    sender_id: str
    status: Optional[str] = "active"


@router.post("/sender-ids/advanta")
async def add_advanta_sender_id(
    data: CreateAdvantaSenderIdRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Add a new carrier approved sender ID to the pool."""
    sender_upper = data.sender_id.upper().strip()
    if not sender_upper:
        raise HTTPException(status_code=400, detail="Sender ID cannot be empty.")
    if len(sender_upper) > 20:
        raise HTTPException(status_code=400, detail="Sender ID too long (max 20 chars).")

    # Check if already exists
    res = await db.execute(
        select(AdvantaSenderId).where(AdvantaSenderId.sender_id == sender_upper)
    )
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Sender ID '{sender_upper}' is already in the Advanta-approved pool."
        )

    item = AdvantaSenderId(
        sender_id=sender_upper,
        status=data.status or "active"
    )
    db.add(item)
    await db.flush()
    return {"message": f"Sender ID '{sender_upper}' added to the pool successfully."}


@router.delete("/sender-ids/advanta/{id}")
async def delete_advanta_sender_id(
    id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Remove a carrier approved sender ID from the pool."""
    res = await db.execute(select(AdvantaSenderId).where(AdvantaSenderId.id == id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Sender ID not found in pool.")

    await db.delete(item)
    await db.flush()
    return {"message": "Sender ID removed from pool successfully."}


@router.post("/sender-ids/advanta/{id}/toggle")
async def toggle_advanta_sender_id_status(
    id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Toggle the carrier approved sender ID active status."""
    res = await db.execute(select(AdvantaSenderId).where(AdvantaSenderId.id == id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Sender ID not found in pool.")

    item.status = "inactive" if item.status == "active" else "active"
    await db.flush()
    return {"message": f"Sender ID status toggled to '{item.status}' successfully.", "status": item.status}


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
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List transactions across all tenants with advanced filters."""
    q = select(Transaction).options(joinedload(Transaction.user)).order_by(Transaction.created_at.desc())
    
    # We join with User if filtering by client details
    if search:
        q = q.join(Transaction.user).where(
            User.email.ilike(f"%{search}%") | 
            User.full_name.ilike(f"%{search}%") | 
            Transaction.reference.ilike(f"%{search}%") |
            Transaction.description.ilike(f"%{search}%")
        )
        
    if status and status != 'all':
        q = q.where(Transaction.status == status)
        
    if method and method != 'all':
        q = q.where(Transaction.payment_method.ilike(method))
        
    if type and type != 'all':
        q = q.where(Transaction.type == type)
        
    from datetime import timedelta
    if date_from:
        try:
            df = datetime.strptime(date_from, "%Y-%m-%d")
            q = q.where(Transaction.created_at >= df)
        except ValueError:
            pass
            
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            q = q.where(Transaction.created_at < dt)
        except ValueError:
            pass

    q = q.limit(150)
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
            "payment_method": t.payment_method or "Mpesa",
            "status": t.status,
            "created_at": t.created_at,
            "user_email": t.user.email if t.user else "Unknown User",
            "user_name": t.user.full_name if t.user else "Unknown"
        }
        for t in txs
    ]


@router.get("/revenue/stats")
async def get_revenue_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve financial analytics and payment stats for the Revenue section."""
    from datetime import timedelta
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    
    # Start of week (Monday)
    week_start = today_start - timedelta(days=now.weekday())
    
    # Start of month
    month_start = datetime(now.year, now.month, 1)
    
    # Start of year
    year_start = datetime(now.year, 1, 1)
    
    # Helper to sum amounts for topups with completed status
    async def sum_topup_since(start_date=None):
        q = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            (Transaction.type == "topup") &
            (Transaction.status == "completed")
        )
        if start_date:
            q = q.where(Transaction.created_at >= start_date)
        res = await db.execute(q)
        return float(res.scalar())

    total_revenue = await sum_topup_since()
    today_revenue = await sum_topup_since(today_start)
    week_revenue = await sum_topup_since(week_start)
    month_revenue = await sum_topup_since(month_start)
    year_revenue = await sum_topup_since(year_start)

    # 30 days trend
    trend_data = []
    for i in range(29, -1, -1):
        target_day = today_start - timedelta(days=i)
        next_day = target_day + timedelta(days=1)
        
        q = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            (Transaction.type == "topup") &
            (Transaction.status == "completed") &
            (Transaction.created_at >= target_day) &
            (Transaction.created_at < next_day)
        )
        res = await db.execute(q)
        daily_amount = float(res.scalar())
        trend_data.append({
            "date": target_day.strftime("%m-%d"),
            "full_date": target_day.strftime("%Y-%m-%d"),
            "amount": daily_amount
        })

    # By Payment Method
    q_method = select(
        func.coalesce(Transaction.payment_method, 'mpesa').label('method'),
        func.coalesce(func.sum(Transaction.amount), 0).label('amount')
    ).where(
        (Transaction.type == "topup") &
        (Transaction.status == "completed")
    ).group_by(Transaction.payment_method)
    
    res_method = await db.execute(q_method)
    methods_raw = res_method.all()
    
    by_payment_method = []
    total_method_sum = sum(float(r[1]) for r in methods_raw)
    
    for r in methods_raw:
        method_name = str(r[0]).title() if r[0] else "Mpesa"
        if not method_name or method_name == 'None':
            method_name = "Mpesa"
            
        amt = float(r[1])
        percentage = (amt / total_method_sum * 100) if total_method_sum > 0 else 0
        by_payment_method.append({
            "method": method_name,
            "amount": amt,
            "percentage": round(percentage, 2)
        })
        
    if not by_payment_method:
        by_payment_method.append({
            "method": "Mpesa",
            "amount": 0,
            "percentage": 0
        })

    return {
        "total_revenue": total_revenue,
        "today_revenue": today_revenue,
        "week_revenue": week_revenue,
        "month_revenue": month_revenue,
        "year_revenue": year_revenue,
        "trend_data": trend_data,
        "by_payment_method": by_payment_method
    }


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
    "supportEmail": "support@trackomgroup.com",
    "supportPhone": "+254 700 000 000",
    "alertBanner": "",
    "advantasmsDefaultShortcode": "ARVOCAP",
    "smtpUser": "",
    "smtpPassword": ""
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
    smtpUser: str
    smtpPassword: str


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
