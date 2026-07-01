"""ContactInquiry schemas for input validation and output representation."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ContactInquiryCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    inquiry_type: str = Field(..., description="sales, support, partnership, other")
    subject: str = Field(..., min_length=1, max_length=300)
    message: str = Field(..., min_length=1)


class ContactInquiryResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    company: Optional[str]
    phone: Optional[str]
    inquiry_type: str
    subject: str
    message: str
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}
