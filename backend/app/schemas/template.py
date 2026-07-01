"""SMS Template schemas."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CreateTemplateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Title of the template")
    content: str = Field(..., min_length=1, max_length=1600, description="Message body content")


class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = Field(None, min_length=1, max_length=1600)


class SmsTemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
