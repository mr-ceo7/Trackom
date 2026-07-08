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
from app.models.notification import Notification
from app.middleware.auth import get_current_user
from app.schemas.campaigns import CampaignCreate, CampaignResponse, CampaignUpdate
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
        .where(
            Campaign.user_id == current_user.id,
            Campaign.deleted_at.is_(None),
            Campaign.sandbox_mode == current_user.sandbox_mode
        )
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
    full_message = data.message_content + "\nSTOP *456*9*5#" if (data.message_content and data.include_opt_out) else data.message_content
    calc = calculate_sms_parts(full_message)
    parts = calc["parts"]
    total_cost = len(contacts) * parts

    if current_user.active_balance < total_cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient balance. Need {total_cost} credits, have {current_user.active_balance}."
        )

    db_scheduled_at = None
    if data.scheduled_at is not None:
        db_scheduled_at = data.scheduled_at.replace(tzinfo=None)

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
        scheduled_at=db_scheduled_at,
        group_id=data.group_id,
        started_at=None,
        completed_at=None,
        include_opt_out=data.include_opt_out,
        batch_number=data.batch_number,
        sandbox_mode=current_user.sandbox_mode,
    )


    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    # Trigger campaign processing in the background if it is not scheduled for later
    if not data.scheduled_at:
        from app.services.campaign_worker import send_campaign_messages
        background_tasks.add_task(send_campaign_messages, campaign.id)

    return campaign


@router.delete("/{campaign_id}", status_code=204)
async def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a campaign."""
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid_mod.UUID(campaign_id),
            Campaign.user_id == current_user.id,
            Campaign.deleted_at.is_(None),
            Campaign.sandbox_mode == current_user.sandbox_mode,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign.deleted_at = datetime.utcnow()


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    data: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a campaign (only allowed for drafts or scheduled ones)."""
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid_mod.UUID(campaign_id),
            Campaign.user_id == current_user.id,
            Campaign.deleted_at.is_(None),
            Campaign.sandbox_mode == current_user.sandbox_mode,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    
    if campaign.status not in ("draft", "scheduled"):
        raise HTTPException(
            status_code=400,
            detail="Only draft or scheduled campaigns can be edited."
        )
        
    update_data = data.model_dump(exclude_unset=True)
    if "scheduled_at" in update_data and update_data["scheduled_at"] is not None:
        update_data["scheduled_at"] = update_data["scheduled_at"].replace(tzinfo=None)
        campaign.status = "scheduled"
    elif "scheduled_at" in update_data:
        campaign.status = "draft"
        
    for field, value in update_data.items():
        setattr(campaign, field, value)
        
    # Recalculate recipient count and total cost if message, targeting group, or opt-out flag changed
    if "group_id" in update_data or "message_content" in update_data or "include_opt_out" in update_data:
        if campaign.group_id:
            contacts_result = await db.execute(
                select(Contact)
                .join(Contact.groups)
                .where(
                    ContactGroup.id == campaign.group_id,
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
        campaign.total_recipients = len(contacts)
        
        full_message = campaign.message_content + "\nSTOP *456*9*5#" if (campaign.message_content and campaign.include_opt_out) else campaign.message_content
        calc = calculate_sms_parts(full_message)
        campaign.total_cost = len(contacts) * calc["parts"]
        
    return campaign


@router.post("/{campaign_id}/cancel", response_model=CampaignResponse)
async def cancel_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a campaign. Refunds credits immediately for draft/scheduled, or lets the worker handle partial refund for sending/paused."""
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid_mod.UUID(campaign_id),
            Campaign.user_id == current_user.id,
            Campaign.deleted_at.is_(None),
            Campaign.sandbox_mode == current_user.sandbox_mode,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status not in ("draft", "scheduled", "sending", "paused"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a campaign with status '{campaign.status}'."
        )

    if campaign.status in ("draft", "scheduled"):
        # Full refund — no messages were sent yet
        refund = campaign.total_cost
        current_user.active_balance += float(refund)
        campaign.status = "cancelled"
        campaign.completed_at = datetime.utcnow()
        db.add(Notification(
            user_id=current_user.id,
            title=f"Campaign '{campaign.name}' Cancelled ⛔",
            message=f"Campaign was cancelled before sending. {int(refund)} credits refunded.",
            type="warning",
            action_url="/dashboard/campaigns",
            sandbox_mode=current_user.sandbox_mode,
        ))
    else:
        # sending or paused — just flip status; the running worker will detect and refund unsent
        campaign.status = "cancelled"

    await db.commit()
    await db.refresh(campaign)

    return campaign


@router.post("/{campaign_id}/pause", response_model=CampaignResponse)
async def pause_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pause an actively sending campaign."""
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid_mod.UUID(campaign_id),
            Campaign.user_id == current_user.id,
            Campaign.deleted_at.is_(None),
            Campaign.sandbox_mode == current_user.sandbox_mode,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "sending":
        raise HTTPException(
            status_code=400,
            detail=f"Can only pause a sending campaign. Current status: '{campaign.status}'."
        )

    campaign.status = "paused"
    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/resume", response_model=CampaignResponse)
async def resume_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resume a paused campaign."""
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid_mod.UUID(campaign_id),
            Campaign.user_id == current_user.id,
            Campaign.deleted_at.is_(None),
            Campaign.sandbox_mode == current_user.sandbox_mode,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "paused":
        raise HTTPException(
            status_code=400,
            detail=f"Can only resume a paused campaign. Current status: '{campaign.status}'."
        )

    campaign.status = "sending"
    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/resend", response_model=CampaignResponse, status_code=201)
async def resend_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Clone an existing campaign and queue it for direct sending."""
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid_mod.UUID(campaign_id),
            Campaign.user_id == current_user.id,
            Campaign.deleted_at.is_(None),
            Campaign.sandbox_mode == current_user.sandbox_mode,
        )
    )
    old_campaign = result.scalar_one_or_none()
    if not old_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Verify we still have contacts in target list
    if old_campaign.group_id:
        contacts_result = await db.execute(
            select(Contact)
            .join(Contact.groups)
            .where(
                ContactGroup.id == old_campaign.group_id,
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
            status_code=400,
            detail="Cannot resend campaign: target contacts list is empty."
        )
        
    full_message = old_campaign.message_content + "\nSTOP *456*9*5#" if (old_campaign.message_content and old_campaign.include_opt_out) else old_campaign.message_content
    calc = calculate_sms_parts(full_message)
    total_cost = len(contacts) * calc["parts"]
    
    if current_user.active_balance < total_cost:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient balance. Need {total_cost} credits to resend."
        )
        
    # Clone campaign run
    new_campaign = Campaign(
        user_id=current_user.id,
        name=f"Resend: {old_campaign.name}",
        message_content=old_campaign.message_content,
        sender_id=old_campaign.sender_id,
        status="draft",
        total_recipients=len(contacts),
        total_cost=total_cost,
        group_id=old_campaign.group_id,
        include_opt_out=old_campaign.include_opt_out,
        batch_number=old_campaign.batch_number,
        sandbox_mode=current_user.sandbox_mode,
    )
    
    db.add(new_campaign)
    await db.flush()
    
    # Spawn background task
    from app.services.campaign_worker import send_campaign_messages
    background_tasks.add_task(send_campaign_messages, new_campaign.id)
    
    return new_campaign

