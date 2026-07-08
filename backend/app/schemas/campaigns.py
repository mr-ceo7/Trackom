"""Campaign schemas."""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    message_content: str = Field(..., min_length=1)
    sender_id: str = Field(..., max_length=20)
    scheduled_at: Optional[datetime] = None
    group_id: Optional[uuid.UUID] = None
    include_opt_out: bool = True
    batch_number: Optional[str] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    message_content: Optional[str] = Field(None, min_length=1)
    sender_id: Optional[str] = Field(None, max_length=20)
    scheduled_at: Optional[datetime] = None
    group_id: Optional[uuid.UUID] = None
    include_opt_out: Optional[bool] = None


class CampaignResponse(BaseModel):
    id: uuid.UUID
    name: str
    message_content: str
    sender_id: str
    status: str
    total_recipients: int
    sent_count: int
    delivered_count: int
    failed_count: int
    total_cost: float
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    group_id: Optional[uuid.UUID] = None
    include_opt_out: bool
    batch_number: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}
