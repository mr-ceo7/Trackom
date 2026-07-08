"""SMS Message model."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Text, Numeric, Enum as SAEnum, Boolean
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SmsMessage(Base):
    __tablename__ = "sms_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    campaign_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True)
    sender_id: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum("queued", "sent", "delivered", "failed", "rejected", "scheduled", name="sms_status_enum"),
        default="queued",
        nullable=False,
        index=True
    )
    cost: Mapped[float] = mapped_column(Numeric(10, 4), default=0)
    batch_number: Mapped[str] = mapped_column(String(100), nullable=True, index=True)
    gateway_message_id: Mapped[str] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    sandbox_mode: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))

    sent_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    deleted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, default=None)


    # Relationships
    user = relationship("User", back_populates="sms_messages")
    campaign = relationship("Campaign", back_populates="messages")

    def __repr__(self) -> str:
        return f"<SmsMessage to={self.recipient} status={self.status}>"
