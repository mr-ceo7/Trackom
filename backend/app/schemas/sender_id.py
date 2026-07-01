"""SenderIdRequest validation schemas."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SenderIdRequestCreate(BaseModel):
    sender_id: str = Field(..., min_length=2, max_length=20, pattern=r"^[A-Za-z0-9]+$")
    purpose: str = Field(..., min_length=5)


class SenderIdRequestResponse(BaseModel):
    id: uuid.UUID
    sender_id: str
    purpose: str
    status: str
    rejection_reason: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}
