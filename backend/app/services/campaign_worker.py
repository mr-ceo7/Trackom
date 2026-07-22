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

import re

def compile_template(template: str, contact: Contact) -> str:
    """
    Compiles message templates with dynamic placeholders and fallbacks.
    Example template: "Hello {{name | default='there'}}, your balance is {{balance | default='0'}}."
    """
    contact_data = {
        "name": contact.name or "",
        "phone": contact.phone or "",
        "email": contact.email or "",
        "notes": contact.notes or "",
    }
    custom_attrs = getattr(contact, "custom_attributes", {}) or {}
    
    def replacer(match):
        raw_token = match.group(1).strip()
        
        if "|" in raw_token:
            token, fallback_part = raw_token.split("|", 1)
            token = token.strip()
            fallback_match = re.search(r'(?:default|fallback)\s*=\s*["\'](.*?)["\']', fallback_part)
            fallback = fallback_match.group(1) if fallback_match else ""
        else:
            token = raw_token
            fallback = ""
            
        val = contact_data.get(token.lower())
        if val is None:
            val = custom_attrs.get(token)
            if val is None:
                val = custom_attrs.get(token.lower())
                
        return str(val) if val is not None and str(val).strip() != "" else fallback

    pattern = r"\{\{(.*?)\}\}"
    return re.sub(pattern, replacer, template)


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

            # Publish real-time status update
            try:
                from app.services.event_bus import event_bus
                event_bus.publish(str(user.id), "campaign_update", {
                    "campaign_id": str(campaign.id),
                    "status": "sending"
                })
            except Exception:
                pass

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
                if user.notification_preferences.get("campaign", True):
                    db.add(Notification(
                        user_id=user.id,
                        title=f"Campaign '{campaign.name}' Failed ❌",
                        message="No contacts found to send campaign to.",
                        type="error",
                        action_url="/dashboard/campaigns"
                    ))
                    from app.services.email import send_campaign_summary_email
                    asyncio.create_task(
                        send_campaign_summary_email(
                            email=user.email,
                            name=user.full_name,
                            campaign_name=campaign.name,
                            status="failed",
                            delivered=0,
                            failed=0,
                            refund=0
                        )
                    )
                await db.commit()
                logger.warning(f"Campaign {campaign_id} failed: No contacts found.")
                return

            # 5. Calculate split parts and verify balance
            full_campaign_message = campaign.message_content + "\nSTOP *456*9*5#" if (campaign.message_content and campaign.include_opt_out) else campaign.message_content
            calc = calculate_sms_parts(full_campaign_message)
            sms_parts = calc["parts"]
            total_recipients = len(contacts)
            total_cost = total_recipients * sms_parts

            user_balance = user.sandbox_sms_balance if campaign.sandbox_mode else user.sms_balance
            if not user.is_postpay and user_balance < total_cost:
                campaign.status = "failed"
                campaign.completed_at = datetime.utcnow()
                if user.notification_preferences.get("campaign", True):
                    db.add(Notification(
                        user_id=user.id,
                        title=f"Campaign '{campaign.name}' Failed ❌",
                        message=f"Insufficient balance. Required: {total_cost} credits, Current: {user_balance} credits.",
                        type="error",
                        action_url="/dashboard/wallet",
                        sandbox_mode=campaign.sandbox_mode,
                    ))
                    from app.services.email import send_campaign_summary_email
                    asyncio.create_task(
                        send_campaign_summary_email(
                            email=user.email,
                            name=user.full_name,
                            campaign_name=campaign.name,
                            status="failed",
                            delivered=0,
                            failed=total_recipients,
                            refund=0
                        )
                    )
                await db.commit()
                logger.warning(f"Campaign {campaign_id} failed: Insufficient balance. Need {total_cost}, have {user_balance}.")
                return

            # Deduct balance upfront (locking credits for this campaign)
            if campaign.sandbox_mode:
                user.sandbox_sms_balance -= total_cost
            else:
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
            total_blacklist_refund = 0.0

            for i in range(0, total_recipients, batch_size):
                batch_contacts = contacts[i:i+batch_size]

                # --- Check for pause/cancel between batches ---
                while True:
                    await db.refresh(campaign)
                    
                    # Check for gateway pool underfunding on live campaigns
                    if not campaign.sandbox_mode:
                        from app.services.email import check_and_enforce_gateway_liquidity
                        is_held = await check_and_enforce_gateway_liquidity(db)
                        if is_held:
                            campaign.status = "paused"
                            db.add(Notification(
                                user_id=campaign.user_id,
                                title=f"Campaign '{campaign.name}' Held ⚠️",
                                message="Live campaign dispatch was temporarily held due to underfunded gateway pool.",
                                type="error",
                                action_url="/dashboard/campaigns",
                                sandbox_mode=campaign.sandbox_mode,
                            ))
                            await db.commit()
                            logger.warning(f"Campaign {campaign_id} held/paused due to underfunded gateway pool.")
                            return

                    if campaign.status == "cancelled":
                        # Refund credits for unsent contacts
                        unsent_count = total_recipients - sent_count
                        refund = unsent_count * sms_parts
                        user_result_refund = await db.execute(select(User).where(User.id == campaign.user_id))
                        user_refund = user_result_refund.scalar_one_or_none()
                        if user_refund:
                            if campaign.sandbox_mode:
                                user_refund.sandbox_sms_balance += refund
                            else:
                                user_refund.sms_balance += refund
                        campaign.total_cost -= refund
                        campaign.completed_at = datetime.utcnow()
                        if user.notification_preferences.get("campaign", True):
                            db.add(Notification(
                                user_id=user.id,
                                title=f"Campaign '{campaign.name}' Cancelled ⛔",
                                message=f"Campaign was cancelled. {sent_count} of {total_recipients} messages were sent. {refund} credits refunded.",
                                type="warning",
                                action_url="/dashboard/campaigns",
                                sandbox_mode=campaign.sandbox_mode,
                            ))
                            from app.services.email import send_campaign_summary_email
                            asyncio.create_task(
                                send_campaign_summary_email(
                                    email=user.email,
                                    name=user.full_name,
                                    campaign_name=campaign.name,
                                    status="cancelled",
                                    delivered=sent_count,
                                    failed=total_recipients - sent_count,
                                    refund=refund
                                )
                            )
                        await db.commit()

                        logger.info(f"Campaign {campaign_id} cancelled after {sent_count} sends. Refunded {refund} credits.")
                        return
                    elif campaign.status == "paused":
                        logger.info(f"Campaign {campaign_id} is paused. Waiting...")
                        await asyncio.sleep(5)
                        continue
                    else:
                        break  # status is "sending" — proceed

                async def send_to_one(contact):
                    opt_out_suffix = "\nSTOP *456*9*5#" if campaign.include_opt_out else ""
                    personalized_msg = compile_template(campaign.message_content, contact) + opt_out_suffix
                    
                    if getattr(contact, "is_blacklisted", False):
                        return {
                            "recipient": contact.phone,
                            "status": "rejected",
                            "message_id": None,
                            "cost": 0.0,
                            "error_message": "In Account Blacklist",
                            "compiled_message": personalized_msg
                        }

                    err_msg = None
                    try:
                        res_list = await gateway.send_messages(
                            sender_id=campaign.sender_id,
                            recipients=[contact.phone],
                            message=personalized_msg,
                            db=db,
                            sandbox_mode=user.sandbox_mode
                        )
                        if res_list:
                            res = res_list[0]
                            res["compiled_message"] = personalized_msg
                            
                            # Overwrite cost with actual calculated parts of compiled message
                            calc_single = calculate_sms_parts(personalized_msg)
                            res["cost"] = float(calc_single["parts"])
                            
                            return res
                    except Exception as e:
                        logger.error(f"Gateway failed for contact {contact.phone}: {e}")
                        err_msg = str(e)
                    
                    calc_single = calculate_sms_parts(personalized_msg)
                    return {
                        "recipient": contact.phone,
                        "status": "failed",
                        "message_id": None,
                        "cost": float(calc_single["parts"]),
                        "error_message": err_msg or "Gateway error",
                        "compiled_message": personalized_msg
                    }

                gateway_results = await asyncio.gather(*(send_to_one(c) for c in batch_contacts))

                # Map response metrics back to models
                batch_adjustment = 0.0
                for res in gateway_results:
                    if res["status"] == "rejected":
                        status_mapped = "rejected"
                        failed_count += 1
                        total_blacklist_refund += sms_parts
                    else:
                        status_mapped = "delivered" if res["status"] == "success" else "failed"
                        if status_mapped == "delivered":
                            delivered_count += 1
                        else:
                            failed_count += 1
                    
                    sent_count += 1
                    
                    # Accumulate balance adjustment (upfront template cost minus actual personalized cost)
                    batch_adjustment += (sms_parts - res["cost"])
                    
                    msg = SmsMessage(
                        user_id=user.id,
                        campaign_id=campaign.id,
                        sender_id=campaign.sender_id,
                        recipient=res["recipient"],
                        content=res.get("compiled_message", campaign.message_content),
                        status=status_mapped,
                        cost=res["cost"],
                        gateway_message_id=res["message_id"],
                        error_message=res["error_message"],
                        batch_number=campaign.batch_number,
                        sent_at=datetime.utcnow(),
                        delivered_at=datetime.utcnow() if status_mapped == "delivered" else None,
                        sandbox_mode=campaign.sandbox_mode,
                    )

                    db.add(msg)

                # Apply batch balance adjustments and update campaign total cost
                if batch_adjustment != 0.0:
                    if campaign.sandbox_mode:
                        user.sandbox_sms_balance += batch_adjustment
                    else:
                        user.sms_balance += batch_adjustment
                    campaign.total_cost -= batch_adjustment

                # Commit batch updates and increment stats
                campaign.sent_count = sent_count
                campaign.delivered_count = delivered_count
                campaign.failed_count = failed_count
                await db.commit()

                # Publish real-time progression update
                try:
                    from app.services.event_bus import event_bus
                    event_bus.publish(str(user.id), "campaign_progress", {
                        "campaign_id": str(campaign.id),
                        "sent_count": sent_count,
                        "delivered_count": delivered_count,
                        "failed_count": failed_count,
                        "total_contacts": len(contacts)
                    })
                except Exception:
                    pass

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
            
            if user.notification_preferences.get("campaign", True):
                db.add(Notification(
                    user_id=user.id,
                    title=f"Campaign '{campaign.name}' Sent! 🚀",
                    message=f"Completed campaign. Delivered: {delivered_count}, Failed: {failed_count}. " + (f"{int(total_blacklist_refund)} blacklist credits refunded." if total_blacklist_refund > 0 else ""),
                    type="success",
                    action_url="/dashboard/campaigns",
                    sandbox_mode=campaign.sandbox_mode,
                ))
                from app.services.email import send_campaign_summary_email
                asyncio.create_task(
                    send_campaign_summary_email(
                        email=user.email,
                        name=user.full_name,
                        campaign_name=campaign.name,
                        status="completed",
                        delivered=delivered_count,
                        failed=failed_count,
                        refund=total_blacklist_refund
                    )
                )

            await db.commit()

            # Publish real-time completion status and wallet balance change if blacklisted
            try:
                from app.services.event_bus import event_bus
                event_bus.publish(str(user.id), "campaign_update", {
                    "campaign_id": str(campaign.id),
                    "status": "completed",
                    "delivered_count": delivered_count,
                    "failed_count": failed_count
                })
                
                # Update wallet balance reactively (e.g. if blacklist credits were refunded)
                event_bus.publish(str(user.id), "wallet_update", {
                    "sms_balance": user.active_balance,
                    "message": f"Campaign '{campaign.name}' completed successfully."
                })
            except Exception:
                pass

            # Low balance check
            new_balance = user.sandbox_sms_balance if campaign.sandbox_mode else user.sms_balance
            if new_balance < 500:
                if user.notification_preferences.get("balance", True):
                    from app.services.email import send_low_balance_email
                    asyncio.create_task(
                        send_low_balance_email(
                            email=user.email,
                            name=user.full_name,
                            current_balance=new_balance
                        )
                    )
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
                    
                    # Publish failure event
                    try:
                        from app.services.event_bus import event_bus
                        event_bus.publish(str(campaign.user_id), "campaign_update", {
                            "campaign_id": str(campaign.id),
                            "status": "failed"
                        })
                    except Exception:
                        pass
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
                    async def send_single_message(message_id):
                        async with async_session() as local_db:
                            q_m = select(SmsMessage).where(SmsMessage.id == message_id)
                            res_m = await local_db.execute(q_m)
                            m = res_m.scalar_one_or_none()
                            if not m:
                                return
                            try:
                                # Update status to queued first to prevent race condition
                                m.status = "queued"
                                await local_db.commit()

                                use_sandbox = m.sandbox_mode
                                
                                # Check for gateway pool underfunding on live scheduled messages
                                if not use_sandbox:
                                    from app.services.email import check_and_enforce_gateway_liquidity
                                    is_held = await check_and_enforce_gateway_liquidity(local_db)
                                    if is_held:
                                        m.status = "scheduled"  # Keep scheduled
                                        m.error_message = "Live dispatch temporarily held due to gateway pool underfunding."
                                        await local_db.commit()
                                        return

                                res_list = await gateway.send_messages(
                                    sender_id=m.sender_id,
                                    recipients=[m.recipient],
                                    message=m.content,
                                    db=local_db,
                                    sandbox_mode=use_sandbox
                                )
                                if res_list:
                                    r = res_list[0]
                                    m.status = "delivered" if r["status"] == "success" else "failed"
                                    m.gateway_message_id = r["message_id"]
                                    m.error_message = r["error_message"]
                                    m.sent_at = datetime.utcnow()
                                await local_db.commit()
                            except Exception as sms_err:
                                logger.error(f"Failed to send scheduled message {message_id}: {sms_err}")
                                try:
                                    await local_db.rollback()
                                    m.status = "failed"
                                    m.error_message = str(sms_err)
                                    await local_db.commit()
                                except Exception:
                                    pass

                    await asyncio.gather(*(send_single_message(msg.id) for msg in scheduled_messages))
                            
        except asyncio.CancelledError:
            logger.info("Scheduled campaign monitor cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in scheduled campaign monitor: {e}", exc_info=True)
