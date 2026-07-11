from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.database import Base

class BlacklistedToken(Base):
    __tablename__ = "blacklisted_tokens"

    jti = Column(String(255), primary_key=True, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
