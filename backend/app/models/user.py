"""User model."""

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, Text, Numeric, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=True)  # Null for OAuth users
    avatar_url: Mapped[str] = mapped_column(Text, nullable=True)

    # Account
    account_type: Mapped[str] = mapped_column(
        SAEnum("business", "reseller", name="account_type_enum", create_constraint=True),
        default="business",
        nullable=False,
    )
    plan: Mapped[str] = mapped_column(
        SAEnum("starter", "growth", "enterprise", name="plan_enum", create_constraint=True),
        default="starter",
        nullable=False,
    )
    sms_balance: Mapped[int] = mapped_column(default=10000)  # Free credits on signup
    sandbox_sms_balance: Mapped[int] = mapped_column(default=10000, nullable=False, server_default=sa.text('10000'))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    sandbox_mode: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default=sa.text('true'))

    @property
    def active_balance(self) -> int:
        return self.sandbox_sms_balance if self.sandbox_mode else self.sms_balance

    @active_balance.setter
    def active_balance(self, value: int):
        if self.sandbox_mode:
            self.sandbox_sms_balance = value
        else:
            self.sms_balance = value


    # Admin configurations
    credit_rate: Mapped[float] = mapped_column(Numeric(10, 4), default=1.0, nullable=False)

    # Reseller structure
    parent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # White-label branding (for resellers)
    custom_logo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    custom_brand_name: Mapped[str] = mapped_column(String(255), nullable=True)
    custom_primary_color: Mapped[str] = mapped_column(String(50), nullable=True)

    # OAuth
    google_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=True)

    # Developer settings
    webhook_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # 2FA settings
    totp_secret: Mapped[str] = mapped_column(String(100), nullable=True)
    is_2fa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    two_factor_method: Mapped[str] = mapped_column(String(20), default="totp", nullable=False)
    otp_code: Mapped[str] = mapped_column(String(10), nullable=True)
    otp_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Notification preferences
    notification_preferences: Mapped[dict] = mapped_column(
        JSON,
        default=lambda: {
            "campaign": True,
            "balance": True,
            "reports": True,
            "api": True,
            "security": True,
        },
        nullable=False,
        server_default=sa.text('\'{"campaign": true, "balance": true, "reports": true, "api": true, "security": true}\''),
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    contacts = relationship("Contact", back_populates="user", cascade="all, delete-orphan")
    contact_groups = relationship("ContactGroup", back_populates="user", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    sms_messages = relationship("SmsMessage", back_populates="user", cascade="all, delete-orphan")
    sms_templates = relationship("SmsTemplate", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
