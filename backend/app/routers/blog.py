"""Blog router — CRUD for posts and categories."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.blog import BlogPost, BlogCategory
from app.models.user import User
from app.middleware.auth import get_current_user, require_admin
from app.schemas.blog import (
    BlogCategoryCreate, BlogCategoryResponse,
    BlogPostCreate, BlogPostUpdate, BlogPostResponse, BlogPostListResponse,
)

router = APIRouter(prefix="/blog", tags=["Blog"])


# ── Public endpoints ──

@router.get("/posts", response_model=List[BlogPostListResponse])
async def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List published blog posts (public)."""
    q = select(BlogPost).where(BlogPost.is_published == True).options(selectinload(BlogPost.category))
    if category:
        q = q.join(BlogCategory).where(BlogCategory.slug == category)
    q = q.order_by(BlogPost.published_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/posts/{slug}", response_model=BlogPostResponse)
async def get_post(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a single blog post by slug (public)."""
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug).options(selectinload(BlogPost.category))
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    # Increment view count
    post.view_count += 1
    return post


@router.get("/categories", response_model=List[BlogCategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List all blog categories (public)."""
    result = await db.execute(select(BlogCategory).order_by(BlogCategory.name))
    return result.scalars().all()


# ── Admin endpoints (auth required) ──

@router.post("/admin/categories", response_model=BlogCategoryResponse, status_code=201)
async def create_category(
    data: BlogCategoryCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a blog category (admin)."""
    cat = BlogCategory(name=data.name, slug=data.slug, description=data.description)
    db.add(cat)
    await db.flush()
    return cat


@router.post("/admin/posts", response_model=BlogPostResponse, status_code=201)
async def create_post(
    data: BlogPostCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a blog post (admin)."""
    # Check slug uniqueness
    existing = await db.execute(select(BlogPost).where(BlogPost.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Slug already exists")

    post = BlogPost(
        title=data.title, slug=data.slug, excerpt=data.excerpt,
        content=data.content, cover_image_url=data.cover_image_url,
        category_id=data.category_id, author_name=data.author_name,
        is_published=data.is_published,
        published_at=datetime.now(timezone.utc) if data.is_published else None,
    )
    db.add(post)
    await db.flush()
    return post


@router.put("/admin/posts/{post_id}", response_model=BlogPostResponse)
async def update_post(
    post_id: str,
    data: BlogPostUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a blog post (admin)."""
    import uuid as uuid_mod
    result = await db.execute(select(BlogPost).where(BlogPost.id == uuid_mod.UUID(post_id)))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    # Set published_at if publishing for first time
    if data.is_published and not post.published_at:
        post.published_at = datetime.now(timezone.utc)

    return post


@router.delete("/admin/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a blog post (admin)."""
    import uuid as uuid_mod
    result = await db.execute(select(BlogPost).where(BlogPost.id == uuid_mod.UUID(post_id)))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
