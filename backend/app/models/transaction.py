"""Transaction (wallet) model."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Text, Numeric, Enum as SAEnum, Boolean
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    type: Mapped[str] = mapped_column(
        SAEnum("topup", "sms_send", "refund", "bonus", name="transaction_type_enum"),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    sms_credits: Mapped[int] = mapped_column(default=0)  # Credits added or deducted
    balance_after: Mapped[int] = mapped_column(default=0)  # Balance snapshot
    reference: Mapped[str] = mapped_column(String(100), nullable=True)  # M-Pesa ref, etc.
    description: Mapped[str] = mapped_column(Text, nullable=True)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=True)  # mpesa, card, etc.
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "completed", "failed", name="transaction_status_enum"),
        default="completed",
        nullable=False,
    )
    sandbox_mode: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


    # Relationships
    user = relationship("User", back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction {self.type} amount={self.amount}>"
