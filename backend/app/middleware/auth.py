"""Auth middleware - FastAPI dependency for extracting current user from JWT."""

import asyncio
import logging
import time
import uuid
from datetime import datetime
from typing import Sequence

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_token

logger = logging.getLogger("trackom.auth")
security = HTTPBearer()

# ---------------------------------------------------------------------------
# Master balance cache (replaces old stateful global on get_current_user)
# ---------------------------------------------------------------------------
_CACHE_TTL_SECONDS = 300  # 5 minutes


class _MasterBalanceCache:
    """Thread/async-safe TTL cache for the SMS gateway master balance."""

    def __init__(self) -> None:
        self._value: int = 10_000_000  # sensible default until first fetch
        self._updated_at: float = 0.0
        self._lock: asyncio.Lock = asyncio.Lock()

    async def get(self) -> int:
        """Return the cached balance, refreshing from the gateway if stale."""
        now = time.time()
        if now - self._updated_at < _CACHE_TTL_SECONDS:
            return self._value

        async with self._lock:
            # Double-check after acquiring the lock
            if time.time() - self._updated_at < _CACHE_TTL_SECONDS:
                return self._value

            try:
                from app.services.sms_gateway import AdvantaSMSGateway

                gateway = AdvantaSMSGateway()
                balance_data = await gateway.check_balance(timeout=2.0)
                if balance_data and "credit" in balance_data:
                    self._value = int(float(balance_data["credit"]))
                    self._updated_at = time.time()
            except Exception as exc:
                logger.warning("Failed to fetch master balance for admin: %s", exc)

        return self._value


_master_balance_cache = _MasterBalanceCache()


# ---------------------------------------------------------------------------
# Core authentication dependency
# ---------------------------------------------------------------------------
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

    from app.utils.token_blacklist import is_token_blacklisted
    jti = payload.get("jti")
    if jti and await is_token_blacklisted(jti, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been blacklisted / logged out",
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

    # Update updated_at to track online/active status (throttled to save DB writes)
    now = datetime.utcnow()
    if user.updated_at is None or (now - user.updated_at).total_seconds() > 300:
        user.updated_at = now

    # If the user is an admin, set their credits to the master gateway pool by default
    if user.is_superuser:
        master_balance = await _master_balance_cache.get()
        user.sms_balance = master_balance
        user.sandbox_sms_balance = master_balance

    return user


# ---------------------------------------------------------------------------
# Role-Based Access Control (RBAC) dependencies
# ---------------------------------------------------------------------------
def require_role(*allowed_roles: str):
    """Dependency factory that restricts access to users with specific roles.

    Accepted role strings:
        - ``"admin"``     – matches ``is_superuser == True``
        - ``"business"``  – matches ``account_type == "business"``
        - ``"reseller"``  – matches ``account_type == "reseller"``

    Usage::

        @router.get("/reseller/dashboard")
        async def reseller_dashboard(
            user: User = Depends(require_role("admin", "reseller")),
        ):
            ...
    """
    async def _role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        # Superusers always pass when "admin" is an allowed role
        if current_user.is_superuser and "admin" in allowed_roles:
            return current_user

        if current_user.account_type in allowed_roles:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access restricted to roles: {', '.join(allowed_roles)}",
        )

    return _role_checker


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
