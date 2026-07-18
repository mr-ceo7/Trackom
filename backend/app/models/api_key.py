"""API Key model."""

import uuid
import secrets
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(8), nullable=False)  # First 8 chars shown
    hashed_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    scope: Mapped[str] = mapped_column(String(50), default="full_access", nullable=False)
    rate_limit: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    ip_whitelist: Mapped[str] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    max_credits: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    is_sandbox: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    last_used_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


    # Relationships
    user = relationship("User", back_populates="api_keys")
    logs = relationship("ApiKeyLog", back_populates="api_key", cascade="all, delete-orphan")

    @staticmethod
    def generate_key() -> str:
        """Generate a new API key string like 'trk_xxxxxxxxxxxxxxxx'."""
        return f"trk_{secrets.token_hex(24)}"

    def __repr__(self) -> str:
        return f"<ApiKey {self.key_prefix}...>"
