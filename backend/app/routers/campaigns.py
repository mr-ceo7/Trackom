"""Campaigns router — manage SMS campaigns."""

import uuid as uuid_mod
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.campaign import Campaign
from app.models.user import User
from app.models.contact import Contact, ContactGroup
from app.models.sms import SmsMessage
from app.middleware.auth import get_current_user
from app.schemas.campaigns import CampaignCreate, CampaignResponse
from app.utils.sms_calc import calculate_sms_parts

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve campaign history for the authenticated user."""
    result = await db.execute(
        select(Campaign)
        .where(Campaign.user_id == current_user.id, Campaign.deleted_at.is_(None))
        .order_by(Campaign.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("", response_model=CampaignResponse, status_code=201)
async def create_campaign(
    data: CampaignCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch targeted contacts (either specific group or all)
    if data.group_id:
        contacts_result = await db.execute(
            select(Contact)
            .join(Contact.groups)
            .where(
                ContactGroup.id == data.group_id,
                ContactGroup.deleted_at.is_(None),
                Contact.user_id == current_user.id,
                Contact.deleted_at.is_(None)
            )
        )
    else:
        contacts_result = await db.execute(
            select(Contact).where(
                Contact.user_id == current_user.id,
                Contact.deleted_at.is_(None)
            )
        )
    contacts = contacts_result.scalars().all()

    if not contacts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot launch a campaign with 0 contacts. Add some contacts first."
        )

    # Estimate cost: accounts for GSM-7 vs Unicode character limits
    calc = calculate_sms_parts(data.message_content)
    parts = calc["parts"]
    total_cost = len(contacts) * parts

    if current_user.sms_balance < total_cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient balance. Need {total_cost} credits, have {current_user.sms_balance}."
        )

    # Create campaign in draft or scheduled status
    campaign = Campaign(
        user_id=current_user.id,
        name=data.name,
        message_content=data.message_content,
        sender_id=data.sender_id,
        status="scheduled" if data.scheduled_at else "draft",
        total_recipients=len(contacts),
        sent_count=0,
        delivered_count=0,
        failed_count=0,
        total_cost=total_cost,
        scheduled_at=data.scheduled_at,
        group_id=data.group_id,
        started_at=None,
        completed_at=None,
    )

    db.add(campaign)
    await db.flush()

    # Trigger campaign processing in the background if it is not scheduled for later
    if not data.scheduled_at:
        from app.services.campaign_worker import send_campaign_messages
        background_tasks.add_task(send_campaign_messages, campaign.id)

    return campaign
