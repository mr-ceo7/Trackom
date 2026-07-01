"""Contacts schemas."""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ContactGroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class ContactGroupResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = None
    group_id: Optional[uuid.UUID] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[str] = None
    group_id: Optional[uuid.UUID] = None


class ContactResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    email: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}
