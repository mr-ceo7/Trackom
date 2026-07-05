"""SMS schemas."""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


import re
from pydantic import BaseModel, Field, field_validator

class SmsSendRequest(BaseModel):
    recipients: List[str] = Field(..., min_length=1, description="List of phone numbers")
    message: str = Field(..., min_length=1, max_length=1600)
    sender_id: str = Field(default="TRACKOM", max_length=11)
    batch_number: Optional[str] = Field(None, max_length=100)
    scheduled_at: Optional[datetime] = Field(None)
    include_opt_out: bool = Field(default=True, description="Append STOP *456*9*5# suffix")

    @field_validator('recipients')
    @classmethod
    def validate_recipients(cls, v: List[str]) -> List[str]:
        pattern = re.compile(r"^\+[1-9]\d{1,14}$")
        for num in v:
            cleaned = num.strip()
            if not pattern.match(cleaned):
                raise ValueError(f"Phone number '{num}' must be in E.164 format (e.g. +254712345678)")
        return [num.strip() for num in v]



class SmsSendResponse(BaseModel):
    queued: int
    total_cost: int
    message_id: str
    status: str


class SmsMessageResponse(BaseModel):
    id: uuid.UUID
    recipient: str
    content: str
    sender_id: Optional[str]
    status: str
    cost: float
    batch_number: Optional[str]
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    scheduled_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}
