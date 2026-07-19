"""Notifications router."""

import uuid as uuid_mod
import asyncio
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.middleware.auth import get_current_user
from app.schemas.notifications import NotificationResponse
from app.utils.security import decode_token

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all notifications for the current user."""
    result = await db.execute(
        select(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.sandbox_mode == current_user.sandbox_mode
        )
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return result.scalars().all()


@router.put("/{id}/read", response_model=NotificationResponse)
async def mark_as_read(
    id: uuid_mod.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == id,
            Notification.user_id == current_user.id,
            Notification.sandbox_mode == current_user.sandbox_mode
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    notification.is_read = True
    await db.flush()
    return notification


@router.put("/read-all", status_code=status.HTTP_200_OK)
async def read_all_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications of the current user as read."""
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.sandbox_mode == current_user.sandbox_mode
        )
        .values(is_read=True)
    )
    await db.flush()
    return {"message": "All notifications marked as read"}


@router.get("/stream")
async def stream_notifications(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Server-Sent Events endpoint to stream real-time events for the authenticated user."""
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
        
    try:
        user_uuid = uuid_mod.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    # Verify active user in DB
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive or non-existent user",
        )

    from app.services.event_bus import event_bus

    async def event_generator():
        # Subscribe to the event queue
        queue = event_bus.subscribe(user_id_str)
        try:
            # Yield initial connection confirmation
            yield f"data: {json.dumps({'type': 'connected', 'data': {}})}\n\n"
            
            while True:
                # Wait for a new event from event_bus
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Send a keep-alive comment to keep connection active
                    yield ": keep-alive\n\n"
        except asyncio.CancelledError:
            # Clean up subscription when client disconnects
            pass
        finally:
            event_bus.unsubscribe(user_id_str, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

