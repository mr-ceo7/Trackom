"""Auth middleware - FastAPI dependency for extracting current user from JWT."""

import uuid
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from the Authorization header."""
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Update updated_at to track online/active status
    user.updated_at = datetime.utcnow()

    # If the user is an admin, set their credits to the master gateway pool by default
    if user.is_superuser:
        import time
        global _last_master_balance
        if 'logging' not in globals():
            import logging
            logger = logging.getLogger("trackom.auth")
        else:
            logger = logging.getLogger("trackom.auth")
            
        now_time = time.time()
        # Initialize global cache if not present
        if not hasattr(get_current_user, "_last_master_balance"):
            get_current_user._last_master_balance = {"value": 10000000, "updated_at": 0.0}
            
        cache = get_current_user._last_master_balance
        if now_time - cache["updated_at"] >= 15:
            from app.services.sms_gateway import AdvantaSMSGateway
            gateway = AdvantaSMSGateway()
            try:
                balance_data = await gateway.check_balance(timeout=2.0)
                if balance_data and "credit" in balance_data:
                    val = int(float(balance_data["credit"]))
                    cache["value"] = val
                    cache["updated_at"] = now_time
            except Exception as e:
                logger.warning(f"Failed to fetch master balance for admin: {e}")
                
        user.sms_balance = cache["value"]
        user.sandbox_sms_balance = cache["value"]

    return user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency that ensures the authenticated user is an administrator (superuser)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

