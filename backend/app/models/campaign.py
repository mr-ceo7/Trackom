"""Campaign model."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Numeric, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    message_content: Mapped[str] = mapped_column(Text, nullable=False)
    sender_id: Mapped[str] = mapped_column(String(20), default="TRACKOM")
    status: Mapped[str] = mapped_column(
        SAEnum("draft", "scheduled", "sending", "completed", "failed", "cancelled", name="campaign_status_enum"),
        default="draft",
        nullable=False,
        index=True
    )
    # Stats
    total_recipients: Mapped[int] = mapped_column(Integer, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    delivered_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    total_cost: Mapped[float] = mapped_column(Numeric(12, 4), default=0)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contact_groups.id", ondelete="SET NULL"), nullable=True)
    deleted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, default=None)
    include_opt_out: Mapped[bool] = mapped_column(default=True, nullable=False)


    # Scheduling
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="campaigns")
    messages = relationship("SmsMessage", back_populates="campaign", cascade="all, delete-orphan")
    group = relationship("ContactGroup")

    def __repr__(self) -> str:
        return f"<Campaign {self.name} status={self.status}>"

