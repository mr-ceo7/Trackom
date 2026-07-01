"""Wallet & transaction schemas."""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


import re
from pydantic import BaseModel, Field, field_validator

class TopupRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in KES to top up")
    phone_number: str = Field(..., min_length=10, max_length=15, description="M-Pesa phone number")

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip()
        if cleaned.startswith("0"):
            cleaned = "+254" + cleaned[1:]
        elif cleaned.startswith("254") and not cleaned.startswith("+"):
            cleaned = "+" + cleaned
        elif not cleaned.startswith("+") and cleaned.isdigit():
            cleaned = "+" + cleaned

        pattern = re.compile(r"^\+[1-9]\d{1,14}$")
        if not pattern.match(cleaned):
            raise ValueError("Phone number must be in E.164 format (e.g. +254712345678)")
        return cleaned



class TopupResponse(BaseModel):
    checkout_request_id: str
    merchant_request_id: str
    response_code: str
    response_description: str
    status: str


class TransactionResponse(BaseModel):
    id: uuid.UUID
    type: str
    amount: float
    sms_credits: int
    balance_after: int
    reference: Optional[str]
    description: Optional[str]
    payment_method: Optional[str]
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}
