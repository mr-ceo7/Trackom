"""Incoming SMS Message model."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IncomingSms(Base):
    __tablename__ = "incoming_sms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    sender: Mapped[str] = mapped_column(String(20), nullable=False) # "from" phone number
    recipient: Mapped[str] = mapped_column(String(20), nullable=False) # "to" shortcode / number
    content: Mapped[str] = mapped_column(Text, nullable=False)
    gateway_message_id: Mapped[str] = mapped_column(String(100), nullable=True)
    sandbox_mode: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))
    received_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    deleted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, default=None)


    # Relationships
    user = relationship("User", backref="incoming_sms")

    def __repr__(self) -> str:
        return f"<IncomingSms from={self.sender} to={self.recipient}>"
