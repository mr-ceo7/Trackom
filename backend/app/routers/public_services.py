"""AdvantaSMS compatibility routes — sendsms, sendbulk, sendotp, getbalance, getdlr."""

from datetime import datetime
import math
import uuid as uuid_mod
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, Form, Request, status
import sqlalchemy as sa
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.api_key import ApiKey
from app.models.api_key_log import ApiKeyLog
from app.models.user import User
from app.models.sms import SmsMessage
from app.utils.security import verify_password
from app.utils.sms_calc import calculate_sms_parts
from app.services.sms_gateway import get_sms_gateway
from app.utils.limiter import limiter

router = APIRouter(tags=["Advanta Compatibility Service"])


async def authenticate_api_key(apikey: str, db: AsyncSession) -> Optional[ApiKey]:
    if not apikey or not apikey.startswith("trk_") or len(apikey) < 10:
        return None
    prefix = apikey[:8]
    # Query all active keys with this prefix
    q = select(ApiKey).where(ApiKey.key_prefix == prefix, ApiKey.is_active == True).options(selectinload(ApiKey.user))
    res = await db.execute(q)
    keys = res.scalars().all()
    for key in keys:
        if verify_password(apikey, key.hashed_key):
            if key.expires_at and key.expires_at < datetime.utcnow():
                continue
            return key
    return None


async def log_api_key_usage(
    db: AsyncSession,
    key: ApiKey,
    endpoint: str,
    method: str,
    status: int,
    credits: float,
    request: Optional[Request] = None
):
    try:
        key.usage_count += 1
        key.last_used_at = datetime.utcnow()
        
        ip_address = None
        user_agent = None
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            
        log = ApiKeyLog(
            api_key_id=key.id,
            endpoint=endpoint,
            method=method,
            status=status,
            credits=credits,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)
        await db.flush()
    except Exception as e:
        import logging
        logging.getLogger("trackom").error(f"Failed to log API key usage: {e}")


async def process_sendsms(
    apikey: str,
    partnerID: Optional[str],
    message: str,
    shortcode: str,
    mobile: str,
    timeToSend: Optional[str],
    hashed: Optional[bool],
    db: AsyncSession,
    request: Optional[Request] = None
):
    # Validate parameters
    if not apikey:
        return {"response-code": 1006, "response-description": "Invalid credentials"}
    if not mobile or not message:
        return {"response-code": 1005, "response-description": "System error"}

    # 2. Authenticate by Trackom API key
    key = await authenticate_api_key(apikey, db)
    if not key or not key.user or not key.user.is_active:
        return {"response-code": 1006, "response-description": "Invalid credentials"}
    user = key.user

    # 3. Parse recipients
    recipients = [r.strip() for r in mobile.split(",") if r.strip()]
    if not recipients:
        await log_api_key_usage(
            db=db,
            key=key,
            endpoint="/api/services/sendsms",
            method=request.method if request else "POST",
            status=400,
            credits=0.0,
            request=request
        )
        return {"response-code": 1003, "response-description": "Invalid mobile number"}

    # 4. Check balance
    calc = calculate_sms_parts(message)
    sms_parts = calc["parts"]
    per_message_cost = float(sms_parts)
    total_cost = int(math.ceil(len(recipients) * per_message_cost))

    if user.active_balance < total_cost:
        await log_api_key_usage(
            db=db,
            key=key,
            endpoint="/api/services/sendsms",
            method=request.method if request else "POST",
            status=400,
            credits=0.0,
            request=request
        )
        return {"response-code": 1004, "response-description": "Low bulk credits"}

    # Check for live gateway liquidity if live
    if not user.sandbox_mode:
        from app.services.email import check_and_enforce_gateway_liquidity
        is_held = await check_and_enforce_gateway_liquidity(db)
        if is_held:
            await log_api_key_usage(
                db=db,
                key=key,
                endpoint="/api/services/sendsms",
                method=request.method if request else "POST",
                status=500,
                credits=0.0,
                request=request
            )
            return {"response-code": 1007, "response-description": "System error"}

    # Handle scheduling if timeToSend is provided
    scheduled_time = None
    initial_status = "queued"
    if timeToSend:
        try:
            # Check if unix timestamp or string date
            if str(timeToSend).isdigit():
                scheduled_time = datetime.utcfromtimestamp(int(timeToSend))
            else:
                scheduled_time = datetime.fromisoformat(str(timeToSend).replace("Z", "+00:00"))
            initial_status = "scheduled"
        except Exception:
            pass

    # 5. Create SmsMessage records
    batch_id = str(uuid_mod.uuid4())
    now = datetime.utcnow()
    messages_to_send = []

    for phone in recipients:
        msg = SmsMessage(
            user_id=user.id,
            recipient=phone,
            content=message,
            sender_id=shortcode,
            status=initial_status,
            cost=per_message_cost,
            batch_number=batch_id,
            sent_at=None if initial_status == "scheduled" else now,
            scheduled_at=scheduled_time,
            sandbox_mode=user.sandbox_mode,
        )
        db.add(msg)
        messages_to_send.append(msg)

    user.active_balance -= total_cost
    await db.flush()

    # 6. Dispatch via SMS gateway if not scheduled
    if initial_status == "queued":
        gateway = get_sms_gateway()
        try:
            gateway_results = await gateway.send_messages(
                sender_id=shortcode,
                recipients=[m.recipient for m in messages_to_send],
                message=message,
                db=db,
                sandbox_mode=user.sandbox_mode
            )
            for msg, res in zip(messages_to_send, gateway_results):
                msg.status = "delivered" if res["status"] == "success" else "failed"
                msg.gateway_message_id = res["message_id"]
                msg.error_message = res["error_message"]
        except Exception as e:
            for msg in messages_to_send:
                msg.status = "failed"
                msg.error_message = str(e)
    
    await db.flush()

    # 7. Format exact Advanta compatible response
    response_items = []
    for msg in messages_to_send:
        is_success = msg.status in ("delivered", "scheduled")
        response_items.append({
            "response-code": 200 if is_success else 1003,
            "response-description": "Success" if is_success else (msg.error_message or "System error"),
            "mobile": msg.recipient,
            "messageid": msg.gateway_message_id or batch_id
        })

    # Log API Key usage on success
    await log_api_key_usage(
        db=db,
        key=key,
        endpoint="/api/services/sendsms",
        method=request.method if request else "POST",
        status=200,
        credits=float(total_cost),
        request=request
    )

    return response_items


@router.post("/api/services/sendsms")
@limiter.limit("60/minute")
async def sendsms_post(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    apikey = None
    partnerID = None
    message = None
    shortcode = None
    mobile = None
    timeToSend = None
    hashed = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            apikey = body.get("apikey")
            partnerID = body.get("partnerID")
            message = body.get("message")
            shortcode = body.get("shortcode")
            mobile = body.get("mobile")
            timeToSend = body.get("timeToSend")
            hashed = body.get("hashed")
        except Exception:
            pass
    else:
        form = await request.form()
        apikey = form.get("apikey")
        partnerID = form.get("partnerID")
        message = form.get("message")
        shortcode = form.get("shortcode")
        mobile = form.get("mobile")
        timeToSend = form.get("timeToSend")
        hashed = form.get("hashed")

    return await process_sendsms(
        apikey=apikey,
        partnerID=partnerID,
        message=message,
        shortcode=shortcode,
        mobile=mobile,
        timeToSend=timeToSend,
        hashed=hashed,
        db=db,
        request=request
    )


@router.get("/api/services/sendsms")
@limiter.limit("60/minute")
async def sendsms_get(
    request: Request,
    apikey: str,
    mobile: str,
    message: str,
    shortcode: str,
    partnerID: Optional[str] = None,
    timeToSend: Optional[str] = None,
    hashed: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    return await process_sendsms(
        apikey=apikey,
        partnerID=partnerID,
        message=message,
        shortcode=shortcode,
        mobile=mobile,
        timeToSend=timeToSend,
        hashed=hashed,
        db=db,
        request=request
    )


@router.post("/api/services/sendotp")
@limiter.limit("60/minute")
async def sendotp_post(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    return await sendsms_post(request, db)


@router.get("/api/services/sendotp")
@limiter.limit("60/minute")
async def sendotp_get(
    request: Request,
    apikey: str,
    mobile: str,
    message: str,
    shortcode: str,
    partnerID: Optional[str] = None,
    timeToSend: Optional[str] = None,
    hashed: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    return await process_sendsms(
        apikey=apikey,
        partnerID=partnerID,
        message=message,
        shortcode=shortcode,
        mobile=mobile,
        timeToSend=timeToSend,
        hashed=hashed,
        db=db,
        request=request
    )


async def process_sendbulk_logic(
    smslist: List[Dict[str, Any]],
    db: AsyncSession,
    request: Request,
    method: str = "POST"
):
    if not smslist:
        return {"response-code": 1005, "response-description": "System error"}

    first_item = smslist[0]
    apikey = first_item.get("apikey")
    if not apikey:
        return {"response-code": 1006, "response-description": "Invalid credentials"}

    key = await authenticate_api_key(apikey, db)
    if not key or not key.user or not key.user.is_active:
        return {"response-code": 1006, "response-description": "Invalid credentials"}
    user = key.user

    total_cost = 0
    items_to_process = []
    for item in smslist:
        mobile = item.get("mobile")
        message = item.get("message")
        shortcode = item.get("shortcode")
        timeToSend = item.get("timeToSend")
        
        if not mobile or not message:
            continue
            
        calc = calculate_sms_parts(message)
        parts = calc["parts"]
        cost = float(parts)
        total_cost += int(math.ceil(cost))
        items_to_process.append({
            "mobile": mobile,
            "message": message,
            "shortcode": shortcode,
            "timeToSend": timeToSend,
            "cost": cost
        })

    if not items_to_process:
        await log_api_key_usage(
            db=db,
            key=key,
            endpoint="/api/services/sendbulk",
            method=method,
            status=400,
            credits=0.0,
            request=request
        )
        return {"response-code": 1005, "response-description": "System error"}

    if user.active_balance < total_cost:
        await log_api_key_usage(
            db=db,
            key=key,
            endpoint="/api/services/sendbulk",
            method=method,
            status=400,
            credits=0.0,
            request=request
        )
        return {"response-code": 1004, "response-description": "Low bulk credits"}

    if not user.sandbox_mode:
        from app.services.email import check_and_enforce_gateway_liquidity
        is_held = await check_and_enforce_gateway_liquidity(db)
        if is_held:
            await log_api_key_usage(
                db=db,
                key=key,
                endpoint="/api/services/sendbulk",
                method=method,
                status=500,
                credits=0.0,
                request=request
            )
            return {"response-code": 1007, "response-description": "System error"}

    batch_id = str(uuid_mod.uuid4())
    now = datetime.utcnow()
    messages_to_send = []

    for item in items_to_process:
        scheduled_time = None
        initial_status = "queued"
        if item["timeToSend"]:
            try:
                if str(item["timeToSend"]).isdigit():
                    scheduled_time = datetime.utcfromtimestamp(int(item["timeToSend"]))
                else:
                    scheduled_time = datetime.fromisoformat(str(item["timeToSend"]).replace("Z", "+00:00"))
                initial_status = "scheduled"
            except Exception:
                pass

        msg = SmsMessage(
            user_id=user.id,
            recipient=item["mobile"],
            content=item["message"],
            sender_id=item["shortcode"],
            status=initial_status,
            cost=item["cost"],
            batch_number=batch_id,
            sent_at=None if initial_status == "scheduled" else now,
            scheduled_at=scheduled_time,
            sandbox_mode=user.sandbox_mode,
        )
        db.add(msg)
        messages_to_send.append(msg)

    user.active_balance -= total_cost
    await db.flush()

    unscheduled = [m for m in messages_to_send if m.status == "queued"]
    if unscheduled:
        gateway = get_sms_gateway()
        groups = {}
        for m in unscheduled:
            key_group = (m.content, m.sender_id)
            if key_group not in groups:
                groups[key_group] = []
            groups[key_group].append(m)

        for (content, sender_id), msgs in groups.items():
            try:
                gateway_results = await gateway.send_messages(
                    sender_id=sender_id,
                    recipients=[m.recipient for m in msgs],
                    message=content,
                    db=db,
                    sandbox_mode=user.sandbox_mode
                )
                for m, res in zip(msgs, gateway_results):
                    m.status = "delivered" if res["status"] == "success" else "failed"
                    m.gateway_message_id = res["message_id"]
                    m.error_message = res["error_message"]
            except Exception as e:
                for m in msgs:
                    m.status = "failed"
                    m.error_message = str(e)

    await db.flush()

    response_items = []
    for msg in messages_to_send:
        is_success = msg.status in ("delivered", "scheduled")
        response_items.append({
            "response-code": 200 if is_success else 1003,
            "response-description": "Success" if is_success else (msg.error_message or "System error"),
            "mobile": msg.recipient,
            "messageid": msg.gateway_message_id or batch_id
        })

    await log_api_key_usage(
        db=db,
        key=key,
        endpoint="/api/services/sendbulk",
        method=method,
        status=200,
        credits=float(total_cost),
        request=request
    )

    return {"responses": response_items}


@router.post("/api/services/sendbulk")
@limiter.limit("60/minute")
async def sendbulk(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        body = await request.json()
    except Exception:
        return {"response-code": 1005, "response-description": "System error"}

    smslist = body.get("smslist", [])
    return await process_sendbulk_logic(smslist, db, request, method="POST")


@router.get("/api/services/sendbulk")
@limiter.limit("60/minute")
async def sendbulk_get(
    request: Request,
    smslist: str,
    db: AsyncSession = Depends(get_db)
):
    """GET version of sendbulk API. Accepts a JSON-encoded list of messages as query parameter 'smslist'."""
    import json
    try:
        parsed_smslist = json.loads(smslist)
    except Exception:
        return {"response-code": 1005, "response-description": "System error"}

    return await process_sendbulk_logic(parsed_smslist, db, request, method="GET")


@router.get("/api/services/getbalance")
@limiter.limit("120/minute")
async def getbalance_get(
    request: Request,
    apikey: str,
    partnerID: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    if not apikey:
        return {"response-code": 1006, "response-description": "Invalid credentials"}

    key = await authenticate_api_key(apikey, db)
    if not key or not key.user or not key.user.is_active:
        return {"response-code": 1006, "response-description": "Invalid credentials"}
    user = key.user

    await log_api_key_usage(
        db=db,
        key=key,
        endpoint="/api/services/getbalance",
        method="GET",
        status=200,
        credits=0.0,
        request=request
    )

    return {
        "response-code": 200,
        "response-description": "Success",
        "credit": float(user.active_balance)
    }


@router.post("/api/services/getbalance")
@limiter.limit("120/minute")
async def getbalance_post(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    apikey = None
    partnerID = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            apikey = body.get("apikey")
            partnerID = body.get("partnerID")
        except Exception:
            pass
    else:
        form = await request.form()
        apikey = form.get("apikey")
        partnerID = form.get("partnerID")

    if not apikey:
        return {"response-code": 1006, "response-description": "Invalid credentials"}

    key = await authenticate_api_key(apikey, db)
    if not key or not key.user or not key.user.is_active:
        return {"response-code": 1006, "response-description": "Invalid credentials"}
    user = key.user

    await log_api_key_usage(
        db=db,
        key=key,
        endpoint="/api/services/getbalance",
        method="POST",
        status=200,
        credits=0.0,
        request=request
    )

    return {
        "response-code": 200,
        "response-description": "Success",
        "credit": float(user.active_balance)
    }


async def process_getdlr(
    apikey: str,
    partnerID: Optional[str],
    messageid: str,
    db: AsyncSession,
    request: Optional[Request] = None
):
    if not apikey or not messageid:
        return {"response-code": 1006, "response-description": "Invalid credentials"}

    key = await authenticate_api_key(apikey, db)
    if not key or not key.user or not key.user.is_active:
        return {"response-code": 1006, "response-description": "Invalid credentials"}
    user = key.user

    q = select(SmsMessage).where(
        SmsMessage.user_id == user.id,
        (SmsMessage.gateway_message_id == messageid) | 
        (sa.cast(SmsMessage.id, sa.String) == messageid)
    )
    res = await db.execute(q)
    msg = res.scalar_one_or_none()

    if not msg:
        await log_api_key_usage(
            db=db,
            key=key,
            endpoint="/api/services/getdlr",
            method=request.method if request else "GET",
            status=404,
            credits=0.0,
            request=request
        )
        return {"response-code": 1008, "response-description": "No Delivery Report"}

    status_mapping = {
        "delivered": "Delivered",
        "sent": "Sent",
        "failed": "Failed",
        "queued": "Queued",
        "scheduled": "Scheduled",
        "rejected": "Rejected"
    }
    status_str = status_mapping.get(msg.status, "Queued")

    await log_api_key_usage(
        db=db,
        key=key,
        endpoint="/api/services/getdlr",
        method=request.method if request else "GET",
        status=200,
        credits=0.0,
        request=request
    )

    return {
        "response-code": 200,
        "response-description": "Success",
        "status": status_str
    }


@router.get("/api/services/getdlr")
@limiter.limit("120/minute")
async def getdlr_get(
    request: Request,
    apikey: str,
    messageid: str,
    partnerID: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await process_getdlr(apikey, partnerID, messageid, db, request=request)


@router.post("/api/services/getdlr")
@limiter.limit("120/minute")
async def getdlr_post(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    apikey = None
    partnerID = None
    messageid = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            apikey = body.get("apikey")
            partnerID = body.get("partnerID")
            messageid = body.get("messageid")
        except Exception:
            pass
    else:
        form = await request.form()
        apikey = form.get("apikey")
        partnerID = form.get("partnerID")
        messageid = form.get("messageid")

    return await process_getdlr(apikey, partnerID, messageid, db, request=request)
