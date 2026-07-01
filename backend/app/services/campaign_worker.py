"""Asynchronous worker for processing campaign broadcasts and monitoring scheduled dispatches."""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
import httpx
from sqlalchemy import select
from app.database import async_session
from app.models.campaign import Campaign
from app.models.user import User
from app.models.contact import Contact, ContactGroup
from app.models.sms import SmsMessage
from app.models.notification import Notification
from app.utils.sms_calc import calculate_sms_parts
from app.services.sms_gateway import get_sms_gateway

logger = logging.getLogger("trackom.campaign_worker")


async def trigger_user_webhook(webhook_url: str, payload: dict):
    """Deliver a status report payload to the user's registered webhook url."""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json=payload, timeout=4.0)
            logger.info(f"Successfully triggered developer webhook callback to {webhook_url}")
    except Exception as e:
        logger.warning(f"Failed to post developer webhook callback to {webhook_url}: {e}")



async def send_campaign_messages(campaign_id: uuid.UUID):
    """
    Asynchronously executes a campaign by sending messages to all associated contacts,
    updating DB stats in real-time batches, and deducting credits.
    """
    logger.info(f"Starting processing for campaign_id={campaign_id}")
    async with async_session() as db:
        try:
            # 1. Fetch Campaign
            campaign_result = await db.execute(
                select(Campaign).where(Campaign.id == campaign_id)
            )
            campaign = campaign_result.scalar_one_or_none()
            if not campaign:
                logger.error(f"Campaign {campaign_id} not found.")
                return

            if campaign.status in ("sending", "completed", "cancelled"):
                logger.warning(f"Campaign {campaign_id} already processed or processing (status: {campaign.status}).")
                return

            # 2. Fetch User
            user_result = await db.execute(
                select(User).where(User.id == campaign.user_id)
            )
            user = user_result.scalar_one_or_none()
            if not user:
                logger.error(f"User {campaign.user_id} for campaign {campaign_id} not found.")
                campaign.status = "failed"
                await db.commit()
                return

            # 3. Mark campaign as sending
            campaign.status = "sending"
            campaign.started_at = datetime.utcnow()
            await db.commit()

            # 4. Fetch targeted contacts (either group segment or all user contacts)
            has_group = hasattr(campaign, 'group_id') and campaign.group_id is not None
            if has_group:
                contacts_q = (
                    select(Contact)
                    .join(Contact.groups)
                    .where(
                        ContactGroup.id == campaign.group_id,
                        ContactGroup.deleted_at.is_(None),
                        Contact.user_id == user.id,
                        Contact.deleted_at.is_(None)
                    )
                )
            else:
                contacts_q = select(Contact).where(Contact.user_id == user.id, Contact.deleted_at.is_(None))

            contacts_res = await db.execute(contacts_q)
            contacts = contacts_res.scalars().all()


            if not contacts:
                campaign.status = "failed"
                campaign.completed_at = datetime.utcnow()
                db.add(Notification(
                    user_id=user.id,
                    title=f"Campaign '{campaign.name}' Failed ❌",
                    message="No contacts found to send campaign to.",
                    type="error",
                    action_url="/dashboard/campaigns"
                ))
                await db.commit()
                logger.warning(f"Campaign {campaign_id} failed: No contacts found.")
                return

            # 5. Calculate split parts and verify balance
            calc = calculate_sms_parts(campaign.message_content)
            sms_parts = calc["parts"]
            total_recipients = len(contacts)
            total_cost = total_recipients * sms_parts

            if user.sms_balance < total_cost:
                campaign.status = "failed"
                campaign.completed_at = datetime.utcnow()
                db.add(Notification(
                    user_id=user.id,
                    title=f"Campaign '{campaign.name}' Failed ❌",
                    message=f"Insufficient balance. Required: {total_cost} credits, Current: {user.sms_balance} credits.",
                    type="error",
                    action_url="/dashboard/wallet"
                ))
                await db.commit()
                logger.warning(f"Campaign {campaign_id} failed: Insufficient balance. Need {total_cost}, have {user.sms_balance}.")
                return

            # Deduct balance upfront (locking credits for this campaign)
            user.sms_balance -= total_cost
            campaign.total_recipients = total_recipients
            campaign.total_cost = total_cost
            await db.commit()

            # 6. Send in batches to avoid locking gateway and DB
            batch_size = 200
            gateway = get_sms_gateway()
            
            sent_count = 0
            delivered_count = 0
            failed_count = 0

            for i in range(0, total_recipients, batch_size):
                batch_contacts = contacts[i:i+batch_size]
                batch_phones = [c.phone for c in batch_contacts]
                
                try:
                    gateway_results = await gateway.send_messages(
                        sender_id=campaign.sender_id,
                        recipients=batch_phones,
                        message=campaign.message_content,
                        db=db
                    )
                except Exception as e:
                    logger.error(f"Gateway failed for campaign {campaign_id} batch index {i}: {e}")
                    # Treat batch as failed
                    gateway_results = [
                        {
                            "recipient": phone,
                            "status": "failed",
                            "message_id": None,
                            "cost": sms_parts,
                            "error_message": str(e)
                        } for phone in batch_phones
                    ]

                # Map response metrics back to models
                for res in gateway_results:
                    status_mapped = "delivered" if res["status"] == "success" else "failed"
                    
                    if status_mapped == "delivered":
                        delivered_count += 1
                    else:
                        failed_count += 1
                    sent_count += 1
                    
                    msg = SmsMessage(
                        user_id=user.id,
                        campaign_id=campaign.id,
                        sender_id=campaign.sender_id,
                        recipient=res["recipient"],
                        content=campaign.message_content,
                        status=status_mapped,
                        cost=res["cost"],
                        gateway_message_id=res["message_id"],
                        error_message=res["error_message"],
                        sent_at=datetime.utcnow(),
                        delivered_at=datetime.utcnow() if status_mapped == "delivered" else None
                    )
                    db.add(msg)

                # Commit batch updates and increment stats
                campaign.sent_count = sent_count
                campaign.delivered_count = delivered_count
                campaign.failed_count = failed_count
                await db.commit()

                # If developer configured a callback webhook URL, send status update reports asynchronously
                if user.webhook_url:
                    webhook_payload = {
                        "event": "sms.campaign_status_update",
                        "campaign_id": str(campaign.id),
                        "campaign_name": campaign.name,
                        "sender_id": campaign.sender_id,
                        "batch_index": i,
                        "batch_size": len(gateway_results),
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "messages": [
                            {
                                "recipient": res["recipient"],
                                "status": "delivered" if res["status"] == "success" else "failed",
                                "message_id": res["message_id"],
                                "cost_credits": res["cost"],
                                "error": res["error_message"]
                            } for res in gateway_results
                        ]
                    }
                    asyncio.create_task(trigger_user_webhook(user.webhook_url, webhook_payload))
                
                # Small pause to yield loop execution
                await asyncio.sleep(0.02)

            # 7. Complete Campaign
            campaign.status = "completed"
            campaign.completed_at = datetime.utcnow()
            
            db.add(Notification(
                user_id=user.id,
                title=f"Campaign '{campaign.name}' Sent! 🚀",
                message=f"Completed campaign. Delivered: {delivered_count}, Failed: {failed_count}.",
                type="success",
                action_url="/dashboard/campaigns"
            ))
            await db.commit()
            logger.info(f"Campaign {campaign_id} finished processing successfully.")

        except Exception as e:
            logger.exception(f"Exception during campaign run for {campaign_id}: {e}")
            try:
                await db.rollback()
                campaign_result = await db.execute(
                    select(Campaign).where(Campaign.id == campaign_id)
                )
                campaign = campaign_result.scalar_one_or_none()
                if campaign:
                    campaign.status = "failed"
                    await db.commit()
            except Exception as nested_e:
                logger.error(f"Failed to fail-state campaign: {nested_e}")


async def scheduled_campaign_monitor_loop():
    """
    Background loop that polls for scheduled campaigns that are ready to run,
    triggering them asynchronously.
    """
    logger.info("Starting scheduled campaign monitor loop...")
    while True:
        try:
            await asyncio.sleep(15)
            now = datetime.utcnow()
            async with async_session() as db:
                q = select(Campaign).where(
                    Campaign.status == "scheduled",
                    Campaign.scheduled_at <= now,
                    Campaign.deleted_at.is_(None)
                )

                res = await db.execute(q)
                scheduled_campaigns = res.scalars().all()
                
                for c in scheduled_campaigns:
                    logger.info(f"Found scheduled campaign '{c.name}' (ID: {c.id}) ready to execute.")
                    asyncio.create_task(send_campaign_messages(c.id))

                # 2. Process individual scheduled messages
                q_sms = select(SmsMessage).where(
                    SmsMessage.status == "scheduled",
                    SmsMessage.scheduled_at <= now,
                    SmsMessage.deleted_at.is_(None)
                )
                res_sms = await db.execute(q_sms)
                scheduled_messages = res_sms.scalars().all()
                
                if scheduled_messages:
                    logger.info(f"Found {len(scheduled_messages)} scheduled individual messages ready to send.")
                    gateway = get_sms_gateway()
                    for m in scheduled_messages:
                        try:
                            # Update status to queued first to prevent race condition
                            m.status = "queued"
                            await db.commit()
                            
                            res_list = await gateway.send_messages(
                                sender_id=m.sender_id,
                                recipients=[m.recipient],
                                message=m.content,
                                db=db
                            )
                            if res_list:
                                r = res_list[0]
                                m.status = "delivered" if r["status"] == "success" else "failed"
                                m.gateway_message_id = r["message_id"]
                                m.error_message = r["error_message"]
                                m.sent_at = datetime.utcnow()
                            await db.commit()
                        except Exception as sms_err:
                            logger.error(f"Failed to send scheduled message {m.id}: {sms_err}")
                            
        except asyncio.CancelledError:
            logger.info("Scheduled campaign monitor cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in scheduled campaign monitor: {e}", exc_info=True)
