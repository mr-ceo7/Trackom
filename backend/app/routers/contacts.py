"""Contacts router — CRUD for contacts and groups."""

import os
import shutil
import uuid as uuid_mod
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, UploadFile, File, Form, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


from app.database import get_db
from app.models.contact import Contact, ContactGroup
from app.models.user import User
from app.middleware.auth import get_current_user
from app.schemas.contacts import (
    ContactCreate, ContactUpdate, ContactResponse,
    ContactGroupCreate, ContactGroupResponse,
)

router = APIRouter(prefix="/contacts", tags=["Contacts"])


# ── Contact Groups ──

@router.get("/groups", response_model=List[ContactGroupResponse])
async def list_groups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ContactGroup)
        .where(ContactGroup.user_id == current_user.id, ContactGroup.deleted_at.is_(None))
        .order_by(ContactGroup.name)
    )
    return result.scalars().all()


@router.post("/groups", response_model=ContactGroupResponse, status_code=201)
async def create_group(
    data: ContactGroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    group = ContactGroup(user_id=current_user.id, name=data.name, description=data.description)
    db.add(group)
    await db.flush()
    return group


@router.delete("/groups/{group_id}", status_code=204)
async def delete_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ContactGroup).where(
            ContactGroup.id == uuid_mod.UUID(group_id),
            ContactGroup.user_id == current_user.id,
            ContactGroup.deleted_at.is_(None)
        )
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.deleted_at = datetime.utcnow()


# ── Contacts ──

@router.get("", response_model=List[ContactResponse])
async def list_contacts(
    response: Response,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100000),
    search: Optional[str] = None,
    group_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Count total matching contacts (for pagination info)
    from sqlalchemy import func
    count_q = select(func.count(Contact.id)).where(Contact.user_id == current_user.id, Contact.deleted_at.is_(None))
    if group_id:
        try:
            g_uuid = uuid_mod.UUID(group_id)
            count_q = count_q.join(Contact.groups).where(ContactGroup.id == g_uuid, ContactGroup.deleted_at.is_(None))
        except (ValueError, TypeError):
            pass
    if search:
        count_q = count_q.where((Contact.name.ilike(f"%{search}%") | Contact.phone.ilike(f"%{search}%")))
    count_res = await db.execute(count_q)
    total_count = count_res.scalar() or 0
    response.headers["X-Total-Count"] = str(total_count)

    q = select(Contact).where(Contact.user_id == current_user.id, Contact.deleted_at.is_(None))
    if group_id:
        try:
            g_uuid = uuid_mod.UUID(group_id)
            q = q.join(Contact.groups).where(ContactGroup.id == g_uuid, ContactGroup.deleted_at.is_(None))
        except (ValueError, TypeError):
            pass
    if search:
        q = q.where((Contact.name.ilike(f"%{search}%") | Contact.phone.ilike(f"%{search}%")))
    q = q.order_by(Contact.name).offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ContactResponse, status_code=201)
async def create_contact(
    data: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    contact = Contact(
        user_id=current_user.id, name=data.name, phone=data.phone, email=data.email,
    )
    if data.group_id:
        group_result = await db.execute(
            select(ContactGroup).where(ContactGroup.id == data.group_id, ContactGroup.user_id == current_user.id)
        )
        group = group_result.scalar_one_or_none()
        if group:
            contact.groups.append(group)
            
    db.add(contact)
    await db.flush()
    return contact


@router.post("/import", status_code=status.HTTP_202_ACCEPTED)
async def import_contacts(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    group_id: Optional[str] = Form(None),
    import_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts CSV file upload, streams it to a temporary local file,
    and dispatches a background worker to import contacts efficiently.
    """
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid CSV file."
        )

    # Limit file size to 10MB to prevent memory/disk exhaustion
    MAX_IMPORT_SIZE = 10 * 1024 * 1024  # 10MB
    file.file.seek(0, 2)  # Seek to end of file
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    if file_size > MAX_IMPORT_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is 10MB, got {file_size / (1024*1024):.1f}MB."
        )


    # Parse group_id UUID if provided
    parsed_group_id = None
    if group_id:
        try:
            parsed_group_id = uuid_mod.UUID(group_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid group ID format."
            )

    # Write uploaded stream to a temporary location on disk to save RAM
    temp_dir = "/tmp/trackom_imports"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, f"import_{uuid_mod.uuid4()}.csv")

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cache uploaded file on server: {str(e)}"
        )
    finally:
        await file.close()

    # Initialize memory queue for streaming logs
    if import_id:
        from app.utils.import_stream import import_queues
        import asyncio
        import_queues[import_id] = asyncio.Queue()

    # Dispatch to background task worker
    from app.services.contacts_import import process_contacts_csv_import
    background_tasks.add_task(
        process_contacts_csv_import,
        current_user.id,
        temp_file_path,
        parsed_group_id,
        import_id
    )

    return {
        "status": "queued",
        "import_id": import_id,
        "message": "CSV import initiated. You will receive a notification when the import is complete."
    }



@router.get("/import/stream")
async def stream_import(
    import_id: str,
):
    from fastapi.responses import StreamingResponse
    import asyncio

    async def event_generator():
        from app.utils.import_stream import import_queues
        queue = import_queues.get(import_id)
        if not queue:
            yield "data: ❌ [SYSTEM] Connection failed. Streaming session not active.\n\n"
            return
        
        try:
            while True:
                msg = await queue.get()
                yield f"data: {msg}\n\n"
                if "COMPLETE" in msg or "FATAL" in msg or "❌" in msg:
                    break
        except asyncio.CancelledError:
            pass
        finally:
            if import_id in import_queues:
                del import_queues[import_id]

    return StreamingResponse(event_generator(), media_type="text/event-stream")
@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    data: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Contact).where(
            Contact.id == uuid_mod.UUID(contact_id),
            Contact.user_id == current_user.id,
            Contact.deleted_at.is_(None)
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    update_data = data.model_dump(exclude_unset=True)
    update_data.pop("group_id", None)  # Ignore group_id — handled via m2m
    for field, value in update_data.items():
        setattr(contact, field, value)
    return contact


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Contact).where(
            Contact.id == uuid_mod.UUID(contact_id),
            Contact.user_id == current_user.id,
            Contact.deleted_at.is_(None)
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact.deleted_at = datetime.utcnow()
