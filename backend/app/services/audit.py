"""Audit logging service."""

from typing import Optional, Any, Dict
import uuid
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog


async def log_audit_action(
    db: AsyncSession,
    action: str,
    user_id: Optional[uuid.UUID] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> AuditLog:
    """Create a security audit log entry in the database."""
    ip_address = None
    user_agent = None

    if request:
        # Extract IP address, handling proxy headers (X-Forwarded-For)
        x_forwarded_for = request.headers.get("x-forwarded-for")
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(",")[0].strip()
        else:
            ip_address = request.client.host if request.client else None
            
        user_agent = request.headers.get("user-agent")

    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log_entry)
    await db.flush()  # Save changes to the session
    return log_entry
