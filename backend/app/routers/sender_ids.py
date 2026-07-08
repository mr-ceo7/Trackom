"""SenderID requests router — submit and manage alpha-numeric sender whitelisting."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.sender_id import SenderIdRequest
from app.models.user import User
from app.middleware.auth import get_current_user
from app.schemas.sender_id import SenderIdRequestCreate, SenderIdRequestResponse

router = APIRouter(prefix="/sender-ids", tags=["Sender ID Requests"])


@router.get("", response_model=List[SenderIdRequestResponse])
async def list_sender_ids(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all Sender ID registration requests for the current user."""
    result = await db.execute(
        select(SenderIdRequest)
        .where(
            SenderIdRequest.user_id == current_user.id,
            SenderIdRequest.sandbox_mode == current_user.sandbox_mode
        )
        .order_by(SenderIdRequest.created_at.desc())
    )
    return result.scalars().all()


@router.get("/approved", response_model=List[str])
async def list_approved_sender_ids(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve only the approved Sender ID strings for use in Compose/Campaign dropdowns."""
    # 1. Fetch the admin's configured default sender ID
    from app.routers.admin import load_system_settings
    sys_settings = load_system_settings()
    default_sender = sys_settings.get("advantasmsDefaultShortcode", "ARVOCAP").upper().strip()

    # 2. Check if the user has requested any custom sender IDs
    # (requests where the requested sender_id is not the default_sender)
    custom_q = select(SenderIdRequest).where(
        SenderIdRequest.user_id == current_user.id,
        SenderIdRequest.sender_id != default_sender,
        SenderIdRequest.sandbox_mode == current_user.sandbox_mode
    )
    custom_res = await db.execute(custom_q)
    has_custom = len(custom_res.scalars().all()) > 0

    # 3. Retrieve user's own approved sender IDs
    result = await db.execute(
        select(SenderIdRequest.sender_id)
        .where(
            SenderIdRequest.user_id == current_user.id,
            SenderIdRequest.status == "approved",
            SenderIdRequest.sandbox_mode == current_user.sandbox_mode
        )
    )
    user_approved = list(result.scalars().all())

    # If the user has not requested any custom sender IDs yet, they get access to the default sender ID
    if not has_custom:
        if default_sender not in user_approved:
            user_approved.append(default_sender)

    return user_approved


@router.post("", response_model=SenderIdRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_sender_id(
    data: SenderIdRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a request to whitelist a custom Sender ID under CA Kenya rules."""
    sender_upper = data.sender_id.upper().strip()
    
    # Check if user already requested this sender ID
    existing = await db.execute(
        select(SenderIdRequest).where(
            SenderIdRequest.user_id == current_user.id,
            SenderIdRequest.sender_id == sender_upper,
            SenderIdRequest.sandbox_mode == current_user.sandbox_mode
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already submitted a request for Sender ID: {sender_upper}."
        )

    # For development ease and rapid testing:
    # If the user requests a Sender ID starting with 'TEST' or 'DEMO', automatically approve it!
    # Else, leave it pending (which mimics the real compliance audit review process).
    initial_status = "approved" if (sender_upper.startswith("TEST") or sender_upper.startswith("DEMO")) else "pending"

    req = SenderIdRequest(
        user_id=current_user.id,
        sender_id=sender_upper,
        purpose=data.purpose,
        status=initial_status,
        sandbox_mode=current_user.sandbox_mode
    )
    db.add(req)
    await db.flush()
    return req

