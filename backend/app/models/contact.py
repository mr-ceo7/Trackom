"""Contact and ContactGroup models."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Table, Column, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Many-to-many association table
contact_group_members = Table(
    "contact_group_members",
    Base.metadata,
    Column("contact_id", UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", UUID(as_uuid=True), ForeignKey("contact_groups.id", ondelete="CASCADE"), primary_key=True),
)


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    custom_attributes: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_blacklisted: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    deleted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, default=None)

    # Relationships
    user = relationship("User", back_populates="contacts")
    groups = relationship("ContactGroup", secondary=contact_group_members, back_populates="contacts")

    def __repr__(self) -> str:
        return f"<Contact {self.phone}>"


class ContactGroup(Base):
    __tablename__ = "contact_groups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    deleted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, default=None)

    # Relationships
    user = relationship("User", back_populates="contact_groups")
    contacts = relationship("Contact", secondary=contact_group_members, back_populates="groups")

    def __repr__(self) -> str:
        return f"<ContactGroup {self.name}>"

