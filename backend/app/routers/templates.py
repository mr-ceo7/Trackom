"""SMS Template router — manage reusable message templates."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import uuid

from app.database import get_db
from app.models.template import SmsTemplate
from app.models.user import User
from app.middleware.auth import get_current_user
from app.schemas.template import CreateTemplateRequest, UpdateTemplateRequest, SmsTemplateResponse

router = APIRouter(prefix="/templates", tags=["SMS Templates"])


@router.get("", response_model=List[SmsTemplateResponse])
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all SMS templates saved by the authenticated user."""
    q = (
        select(SmsTemplate)
        .where(
            SmsTemplate.user_id == current_user.id,
            SmsTemplate.deleted_at.is_(None),
            SmsTemplate.sandbox_mode == current_user.sandbox_mode
        )
        .order_by(SmsTemplate.created_at.desc())
    )
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=SmsTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    data: CreateTemplateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save a new SMS template."""
    template = SmsTemplate(
        user_id=current_user.id,
        name=data.name,
        content=data.content,
        sandbox_mode=current_user.sandbox_mode
    )
    db.add(template)
    await db.flush()
    return template


@router.put("/{template_id}", response_model=SmsTemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    data: UpdateTemplateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing SMS template."""
    q = select(SmsTemplate).where(
        SmsTemplate.id == template_id,
        SmsTemplate.user_id == current_user.id,
        SmsTemplate.deleted_at.is_(None),
        SmsTemplate.sandbox_mode == current_user.sandbox_mode
    )
    res = await db.execute(q)
    template = res.scalar_one_or_none()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found."
        )

    if data.name is not None:
        template.name = data.name
    if data.content is not None:
        template.content = data.content

    await db.flush()
    return template


@router.delete("/{template_id}")
async def delete_template(
    template_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an SMS template."""
    q = select(SmsTemplate).where(
        SmsTemplate.id == template_id,
        SmsTemplate.user_id == current_user.id,
        SmsTemplate.deleted_at.is_(None),
        SmsTemplate.sandbox_mode == current_user.sandbox_mode
    )
    res = await db.execute(q)
    template = res.scalar_one_or_none()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found."
        )

    template.deleted_at = datetime.utcnow()
    await db.flush()
    return {"message": "Template deleted successfully."}

