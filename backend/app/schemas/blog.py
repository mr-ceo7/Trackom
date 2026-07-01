"""Blog schemas."""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BlogCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class BlogCategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class BlogPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    slug: str = Field(..., min_length=1, max_length=500)
    excerpt: Optional[str] = None
    content: str = Field(..., min_length=1)
    cover_image_url: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    author_name: str = "Trackom Team"
    is_published: bool = False


class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    slug: Optional[str] = Field(None, min_length=1, max_length=500)
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image_url: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    author_name: Optional[str] = None
    is_published: Optional[bool] = None


class BlogPostResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    excerpt: Optional[str]
    content: str
    cover_image_url: Optional[str]
    author_name: str
    is_published: bool
    view_count: int
    category: Optional[BlogCategoryResponse] = None
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class BlogPostListResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    excerpt: Optional[str]
    cover_image_url: Optional[str]
    author_name: str
    is_published: bool
    view_count: int
    category: Optional[BlogCategoryResponse] = None
    published_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}
