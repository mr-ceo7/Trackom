"""SMS router — send messages, view history, and export reports."""

import uuid as uuid_mod
from datetime import datetime, timezone
from typing import List, Optional
import io
import csv
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.sms import SmsMessage
from app.models.user import User
from app.models.incoming import IncomingSms
from app.models.sender_id import SenderIdRequest
from app.middleware.auth import get_current_user
from app.schemas.sms import SmsSendRequest, SmsSendResponse, SmsMessageResponse, IncomingSmsResponse, BulkDeleteRequest
from app.utils.sms_calc import calculate_sms_parts
from app.services.sms_gateway import get_sms_gateway, AdvantaSMSGateway, SmsGatewayException

router = APIRouter(prefix="/messages", tags=["SMS"])


@router.post("/send", response_model=SmsSendResponse)
async def send_sms(
    data: SmsSendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send SMS to one or more recipients. Deducts from user's balance based on rate."""
    full_message = data.message + "\nSTOP *456*9*5#" if (data.message and data.include_opt_out) else data.message
    calc = calculate_sms_parts(full_message)
    sms_parts = calc["parts"]
    
    # Deduct 1 credit per message part
    per_message_cost = float(sms_parts)
    total_cost = int(math.ceil(len(data.recipients) * per_message_cost))

    if current_user.active_balance < total_cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient balance. Need {total_cost} credits, have {current_user.active_balance}."
        )

    batch_id = str(uuid_mod.uuid4())
    now = datetime.utcnow()
    
    # Check if scheduled
    is_scheduled = data.scheduled_at is not None
    initial_status = "scheduled" if is_scheduled else "queued"
    
    db_scheduled_at = None
    if data.scheduled_at is not None:
        db_scheduled_at = data.scheduled_at.replace(tzinfo=None)

    messages_to_send = []
    for phone in data.recipients:
        msg = SmsMessage(
            user_id=current_user.id,
            recipient=phone.strip(),
            content=full_message,
            sender_id=data.sender_id,
            status=initial_status,
            cost=per_message_cost,
            batch_number=data.batch_number,
            scheduled_at=db_scheduled_at,
            sent_at=None if is_scheduled else now,
            sandbox_mode=current_user.sandbox_mode,
        )
        db.add(msg)
        messages_to_send.append(msg)

    current_user.active_balance -= total_cost
    await db.flush()

    # Dispatch immediately via load-balanced gateway if not scheduled
    if not is_scheduled:
        gateway = get_sms_gateway()
        try:
            results = await gateway.send_messages(
                sender_id=data.sender_id,
                recipients=[m.recipient for m in messages_to_send],
                message=full_message,
                db=db,
                sandbox_mode=current_user.sandbox_mode
            )
            for msg, res in zip(messages_to_send, results):
                msg.status = "delivered" if res["status"] == "success" else "failed"
                msg.gateway_message_id = res["message_id"]
                msg.error_message = res["error_message"]
        except Exception as e:
            for msg in messages_to_send:
                msg.status = "failed"
                msg.error_message = str(e)
        
        await db.flush()


    return SmsSendResponse(
        queued=len(data.recipients),
        total_cost=total_cost,
        message_id=batch_id,
        status=initial_status,
    )


def filter_by_date(q, start_date: Optional[str], end_date: Optional[str]):
    if start_date:
        try:
            s_str = start_date
            if len(s_str) == 10:
                s_str += "T00:00:00"
            start_dt = datetime.fromisoformat(s_str)
            q = q.where(SmsMessage.created_at >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            e_str = end_date
            if len(e_str) == 10:
                e_str += "T23:59:59.999999"
            end_dt = datetime.fromisoformat(e_str)
            q = q.where(SmsMessage.created_at <= end_dt)
        except ValueError:
            pass
    return q


@router.get("/history", response_model=List[SmsMessageResponse])
async def message_history(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    batch_number: Optional[str] = Query(None),
    campaign_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get SMS send history for the current user, optionally filtered by batch, campaign, status, and date range."""
    q = (
        select(SmsMessage)
        .where(
            SmsMessage.user_id == current_user.id,
            SmsMessage.deleted_at.is_(None),
            SmsMessage.sandbox_mode == current_user.sandbox_mode
        )
    )
    
    if batch_number:
        q = q.where(SmsMessage.batch_number.ilike(f"%{batch_number}%"))
        
    if campaign_id:
        try:
            q = q.where(SmsMessage.campaign_id == uuid_mod.UUID(campaign_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid campaign ID format.")
        
    if status:
        q = q.where(SmsMessage.status == status.lower())
        
    q = filter_by_date(q, start_date, end_date)
        
    q = q.order_by(SmsMessage.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/stats")
async def sms_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get SMS stats for dashboard."""
    total = await db.execute(
        select(func.count()).where(
            SmsMessage.user_id == current_user.id,
            SmsMessage.deleted_at.is_(None),
            SmsMessage.sandbox_mode == current_user.sandbox_mode
        )
    )
    today = await db.execute(
        select(func.count()).where(
            SmsMessage.user_id == current_user.id,
            SmsMessage.deleted_at.is_(None),
            SmsMessage.sandbox_mode == current_user.sandbox_mode,
            func.date(SmsMessage.created_at) == func.date(func.now())
        )
    )

    return {
        "total_sent": total.scalar() or 0,
        "sent_today": today.scalar() or 0,
        "balance": current_user.active_balance,
    }



@router.get("/export/csv")
async def export_csv(
    batch_number: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export SMS history as CSV."""
    q = select(SmsMessage).where(
        SmsMessage.user_id == current_user.id,
        SmsMessage.deleted_at.is_(None),
        SmsMessage.sandbox_mode == current_user.sandbox_mode,
    )
    if batch_number:
        q = q.where(SmsMessage.batch_number.ilike(f"%{batch_number}%"))
    q = filter_by_date(q, start_date, end_date)
    q = q.order_by(SmsMessage.created_at.desc())
    res = await db.execute(q)
    messages = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Message ID", "Recipient", "Sender ID", "Content", "Status", "Cost (cr)", "Batch Number", "Sent At", "Created At"])
    for m in messages:
        writer.writerow([
            str(m.id),
            m.recipient,
            m.sender_id,
            m.content,
            m.status,
            m.cost,
            m.batch_number or "",
            m.sent_at.isoformat() if m.sent_at else "",
            m.created_at.isoformat()
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sms_report.csv"}
    )


@router.get("/export/xlsx")
async def export_xlsx(
    batch_number: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export SMS history as XML/Excel XLS compatible spreadsheet."""
    q = select(SmsMessage).where(SmsMessage.user_id == current_user.id, SmsMessage.deleted_at.is_(None))
    if batch_number:
        q = q.where(SmsMessage.batch_number.ilike(f"%{batch_number}%"))
    q = filter_by_date(q, start_date, end_date)
    q = q.order_by(SmsMessage.created_at.desc())
    res = await db.execute(q)
    messages = res.scalars().all()

    html = "<table><tr><th>Message ID</th><th>Recipient</th><th>Sender ID</th><th>Content</th><th>Status</th><th>Cost (cr)</th><th>Batch Number</th><th>Sent At</th></tr>"
    for m in messages:
        html += f"<tr><td>{m.id}</td><td>{m.recipient}</td><td>{m.sender_id}</td><td>{m.content}</td><td>{m.status}</td><td>{m.cost}</td><td>{m.batch_number or ''}</td><td>{m.sent_at.isoformat() if m.sent_at else ''}</td></tr>"
    html += "</table>"
    
    return StreamingResponse(
        io.BytesIO(html.encode("utf-8")),
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": "attachment; filename=sms_report.xls"}
    )


@router.get("/export/pdf")
async def export_pdf(
    batch_number: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export SMS history as print-ready HTML template (which browsers print/save as PDF)."""
    q = select(SmsMessage).where(SmsMessage.user_id == current_user.id, SmsMessage.deleted_at.is_(None))
    if batch_number:
        q = q.where(SmsMessage.batch_number.ilike(f"%{batch_number}%"))
    q = filter_by_date(q, start_date, end_date)
    q = q.order_by(SmsMessage.created_at.desc())
    res = await db.execute(q)
    messages = res.scalars().all()
    
    html = f"""
    <html>
    <head>
        <title>Trackom SMS Dispatch Report</title>
        <style>
            body {{ font-family: sans-serif; padding: 20px; color: #333; }}
            h1 {{ color: #4f46e5; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }}
            th {{ background-color: #f3f4f6; }}
        </style>
    </head>
    <body>
        <h1>Trackom SMS Dispatch Report</h1>
        <p><strong>User:</strong> {current_user.full_name} ({current_user.email})</p>
        <p><strong>Date:</strong> {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC</p>
        <table>
            <thead>
                <tr>
                    <th>Recipient</th>
                    <th>Sender ID</th>
                    <th>Content</th>
                    <th>Status</th>
                    <th>Cost</th>
                    <th>Batch</th>
                    <th>Sent At</th>
                </tr>
            </thead>
            <tbody>
    """
    for m in messages:
        html += f"""
                <tr>
                    <td>{m.recipient}</td>
                    <td>{m.sender_id}</td>
                    <td>{m.content}</td>
                    <td>{m.status}</td>
                    <td>{m.cost} cr</td>
                    <td>{m.batch_number or '-'}</td>
                    <td>{m.sent_at.strftime("%Y-%m-%d %H:%M") if m.sent_at else '-'}</td>
                </tr>
        """
    html += """
            </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
    """
    return StreamingResponse(
        io.BytesIO(html.encode("utf-8")),
        media_type="text/html",
        headers={"Content-Disposition": "attachment; filename=sms_report.html"}
    )


@router.delete("/scheduled/{message_id}")
async def cancel_scheduled_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a scheduled SMS message by setting its deleted_at timestamp and refunding credits."""
    try:
        msg_uuid = uuid_mod.UUID(message_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid message ID format.")
    
    q = select(SmsMessage).where(
        SmsMessage.id == msg_uuid,
        SmsMessage.user_id == current_user.id,
        SmsMessage.status == "scheduled",
        SmsMessage.deleted_at.is_(None)
    )
    res = await db.execute(q)
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Scheduled message not found or already sent/cancelled.")
        
    msg.deleted_at = datetime.utcnow()
    # Refund the user
    refund_amount = int(math.ceil(msg.cost))
    current_user.sms_balance += refund_amount
    await db.commit()
    return {"message": "Scheduled message cancelled successfully.", "refunded_credits": refund_amount}


@router.post("/incoming/webhook")
async def incoming_sms_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Receives incoming SMS webhook from SMS gateway (e.g. Africa's Talking or simulator).
    Supports both JSON and Form payloads.
    """
    payload = {}
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        try:
            payload = await request.json()
        except Exception:
            pass
    else:
        try:
            form_data = await request.form()
            payload = dict(form_data)
        except Exception:
            pass

    # Extract fields with multiple fallbacks
    from_val = payload.get("from") or payload.get("sender") or payload.get("From")
    to_val = payload.get("to") or payload.get("recipient") or payload.get("To") or "TRACKOM"
    text_val = payload.get("text") or payload.get("content") or payload.get("message") or payload.get("Body")
    msg_id = payload.get("id") or payload.get("messageId") or payload.get("gateway_message_id")
    
    if not from_val or not text_val:
        # Check if they are in query params as last resort
        from_val = from_val or request.query_params.get("from")
        to_val = to_val or request.query_params.get("to") or "TRACKOM"
        text_val = text_val or request.query_params.get("text")
        msg_id = msg_id or request.query_params.get("id")

    if not from_val or not text_val:
        raise HTTPException(status_code=400, detail="Missing required parameters: from and text/content")

    # Match recipient (shortcode/number) to a user in the database
    user_id = None

    # Try to extract user from Authorization header first (for simulated local requests from the UI)
    from app.utils.security import decode_token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            sub = payload.get("sub")
            if sub:
                try:
                    user_uuid = uuid_mod.UUID(sub)
                    user_q = select(User).where(User.id == user_uuid)
                    user_res = await db.execute(user_q)
                    if user_res.scalar_one_or_none():
                        user_id = user_uuid
                except ValueError:
                    pass

    # Check sender_id_requests where sender_id = to_val (case-insensitive) and status = 'approved'
    if not user_id and to_val:
        sender_q = select(SenderIdRequest).where(
            SenderIdRequest.sender_id.ilike(to_val.strip()),
            SenderIdRequest.status == "approved"
        )
        sender_res = await db.execute(sender_q)
        sender_req = sender_res.scalar_one_or_none()
        if sender_req:
            user_id = sender_req.user_id

    # Fallback: if not matched, associate with the default demo user or the first active user
    if not user_id:
        user_q = select(User).where(User.email == "demo@trackom.co.ke")
        user_res = await db.execute(user_q)
        demo_user = user_res.scalar_one_or_none()
        if demo_user:
            user_id = demo_user.id
        else:
            first_user_q = select(User).limit(1)
            first_user_res = await db.execute(first_user_q)
            first_user = first_user_res.scalar_one_or_none()
            if first_user:
                user_id = first_user.id

    # Save to database
    incoming_msg = IncomingSms(
        user_id=user_id,
        sender=from_val.strip()[:20],
        recipient=to_val.strip()[:20] if to_val else "TRACKOM",
        content=text_val.strip(),
        gateway_message_id=msg_id.strip()[:100] if msg_id else None,
        received_at=datetime.utcnow(),
    )
    db.add(incoming_msg)
    await db.commit()

    return {"status": "success", "message": "Inbound SMS received and logged."}


@router.get("/incoming/unique-batches", response_model=List[str])
async def list_unique_batches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of unique batch numbers for the current user's outgoing messages."""
    q = (
        select(SmsMessage.batch_number)
        .where(
            SmsMessage.user_id == current_user.id,
            SmsMessage.batch_number.isnot(None),
            SmsMessage.batch_number != "",
            SmsMessage.deleted_at.is_(None)
        )
        .distinct()
        .order_by(SmsMessage.batch_number)
    )
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/incoming", response_model=List[IncomingSmsResponse])
async def list_incoming_sms(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    sender: Optional[str] = Query(None),
    recipient: Optional[str] = Query(None),
    group_id: Optional[str] = Query(None),
    batch_number: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve incoming SMS message log history for the authenticated user."""
    from app.models.contact import Contact, contact_group_members
    
    q = (
        select(IncomingSms, Contact.name, Contact.id)
        .outerjoin(Contact, (Contact.phone == IncomingSms.sender) & (Contact.user_id == current_user.id) & (Contact.deleted_at.is_(None)))
        .where(
            IncomingSms.user_id == current_user.id,
            IncomingSms.deleted_at.is_(None),
            IncomingSms.sandbox_mode == current_user.sandbox_mode,
        )
    )
    
    if sender:
        q = q.where(IncomingSms.sender.ilike(f"%{sender.strip()}%"))
    if recipient:
        q = q.where(IncomingSms.recipient.ilike(f"%{recipient.strip()}%"))
        
    if group_id:
        try:
            group_uuid = uuid_mod.UUID(group_id)
            group_subq = (
                select(Contact.phone)
                .join(contact_group_members, contact_group_members.c.contact_id == Contact.id)
                .where(
                    contact_group_members.c.group_id == group_uuid,
                    Contact.user_id == current_user.id,
                    Contact.deleted_at.is_(None)
                )
            )
            q = q.where(IncomingSms.sender.in_(group_subq))
        except ValueError:
            pass

    if batch_number:
        batch_subq = (
            select(SmsMessage.recipient)
            .where(
                SmsMessage.batch_number == batch_number,
                SmsMessage.user_id == current_user.id,
                SmsMessage.deleted_at.is_(None),
                SmsMessage.sandbox_mode == current_user.sandbox_mode,
            )
        )
        q = q.where(IncomingSms.sender.in_(batch_subq))
        
    q = q.order_by(IncomingSms.received_at.desc())
    q = q.offset((page - 1) * limit).limit(limit)
    
    res = await db.execute(q)
    rows = res.all()
    
    response_data = []
    for msg, contact_name, contact_id in rows:
        response_data.append(IncomingSmsResponse(
            id=msg.id,
            sender=msg.sender,
            recipient=msg.recipient,
            content=msg.content,
            gateway_message_id=msg.gateway_message_id,
            received_at=msg.received_at,
            created_at=msg.created_at,
            contact_name=contact_name,
            contact_id=contact_id
        ))
    return response_data


@router.delete("/incoming/{message_id}", status_code=204)
async def delete_incoming_sms(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete an incoming SMS message."""
    try:
        msg_uuid = uuid_mod.UUID(message_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid message ID format.")
        
    q = select(IncomingSms).where(
        IncomingSms.id == msg_uuid,
        IncomingSms.user_id == current_user.id,
        IncomingSms.deleted_at.is_(None),
        IncomingSms.sandbox_mode == current_user.sandbox_mode,
    )
    res = await db.execute(q)
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Incoming message not found")
        
    msg.deleted_at = datetime.utcnow()
    await db.commit()
    return None


@router.post("/incoming/bulk-delete", status_code=204)
async def bulk_delete_incoming_sms(
    data: BulkDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk soft delete incoming SMS messages."""
    q = select(IncomingSms).where(
        IncomingSms.id.in_(data.ids),
        IncomingSms.user_id == current_user.id,
        IncomingSms.deleted_at.is_(None),
        IncomingSms.sandbox_mode == current_user.sandbox_mode,
    )
    res = await db.execute(q)
    messages = res.scalars().all()
    
    now = datetime.utcnow()
    for msg in messages:
        msg.deleted_at = now
        
    await db.commit()
    return None



@router.get("/gateway/balance")
async def gateway_balance(
    current_user: User = Depends(get_current_user),
):
    """Returns the AdvantaSMS account balance (admin-level info)."""
    gateway = AdvantaSMSGateway()
    try:
        data = await gateway.check_balance()
        return data
    except SmsGatewayException as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/{message_id}/delivery-report")
async def get_delivery_report(
    message_id: str,
    current_user: User = Depends(get_current_user),
):
    """Fetches the delivery report from AdvantaSMS for a specific gateway message ID."""
    gateway = AdvantaSMSGateway()
    try:
        data = await gateway.get_delivery_report(message_id)
        return data
    except SmsGatewayException as e:
        raise HTTPException(status_code=502, detail=str(e))

