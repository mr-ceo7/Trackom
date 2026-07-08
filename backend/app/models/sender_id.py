"""SenderIdRequest model for whitelisting custom alpha-numeric sender headers."""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SAEnum, Boolean
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SenderIdRequest(Base):
    __tablename__ = "sender_id_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[str] = mapped_column(String(20), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "approved", "rejected", name="sender_id_status_enum"),
        default="pending",
        nullable=False
    )
    rejection_reason: Mapped[str] = mapped_column(Text, nullable=True)
    sandbox_mode: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)



    # Relationships
    user = relationship("User", backref="sender_id_requests")

    def __repr__(self) -> str:
        return f"<SenderIdRequest {self.sender_id} status={self.status}>"
