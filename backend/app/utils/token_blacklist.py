from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.token_blacklist import BlacklistedToken

async def blacklist_token(jti: str, expire: datetime, db: AsyncSession):
    """Blacklist a token by its JWT ID (jti) until it expires in the database."""
    db_expire = expire.replace(tzinfo=None) if expire.tzinfo else expire
    blacklisted = BlacklistedToken(jti=jti, expires_at=db_expire)
    db.add(blacklisted)
    await db.commit()
    # Cleanup expired tokens asynchronously
    await _cleanup_blacklist(db)

async def is_token_blacklisted(jti: str, db: AsyncSession) -> bool:
    """Check if a JWT ID (jti) is in the database blacklist and not yet expired."""
    if not jti:
        return False
    now = datetime.utcnow()
    q = select(BlacklistedToken).where(
        BlacklistedToken.jti == jti,
        BlacklistedToken.expires_at > now
    )
    res = await db.execute(q)
    return res.scalar_one_or_none() is not None

async def _cleanup_blacklist(db: AsyncSession):
    """Remove expired tokens from the database blacklist."""
    from sqlalchemy import delete
    now = datetime.utcnow()
    q = delete(BlacklistedToken).where(BlacklistedToken.expires_at <= now)
    await db.execute(q)
    await db.commit()
