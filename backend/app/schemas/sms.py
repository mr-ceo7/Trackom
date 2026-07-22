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
    sender_id: str = Field(..., max_length=11)
    batch_number: Optional[str] = Field(None, max_length=100)
    scheduled_at: Optional[datetime] = Field(None)
    include_opt_out: bool = Field(default=True, description="Append STOP *456*9*5# suffix")

    @field_validator('recipients')
    @classmethod
    def validate_recipients(cls, v: List[str]) -> List[str]:
        pattern = re.compile(r"^\+[1-9]\d{1,14}$")
        normalized = []
        for num in v:
            # Clean formatting characters
            cleaned = num.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            
            # Map 07... (Kenyan local format) to +2547...
            if cleaned.startswith("0") and len(cleaned) == 10:
                cleaned = "+254" + cleaned[1:]
            # Map 7... or 1... to +254...
            elif (cleaned.startswith("7") or cleaned.startswith("1")) and len(cleaned) == 9:
                cleaned = "+254" + cleaned
            # Map 254... to +254...
            elif cleaned.startswith("254") and len(cleaned) == 12:
                cleaned = "+" + cleaned
            # Prepend '+' to digits-only E.164 strings
            elif cleaned.isdigit():
                cleaned = "+" + cleaned
                
            if not pattern.match(cleaned):
                raise ValueError(f"Phone number '{num}' must be in E.164 format (e.g. +254712345678)")
            normalized.append(cleaned)
        return normalized



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
    error_message: Optional[str] = None
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    scheduled_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}


class IncomingSmsResponse(BaseModel):
    id: uuid.UUID
    sender: str
    recipient: str
    content: str
    gateway_message_id: Optional[str]
    received_at: datetime
    created_at: datetime
    contact_name: Optional[str] = None
    contact_id: Optional[uuid.UUID] = None
    model_config = {"from_attributes": True}


class BulkDeleteRequest(BaseModel):
    ids: List[uuid.UUID]
