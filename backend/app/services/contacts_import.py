import asyncio
import csv
import logging
import os
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import select, insert

from app.database import async_session
from app.models.contact import Contact, ContactGroup, contact_group_members
from app.models.notification import Notification

logger = logging.getLogger("trackom.contacts_import")


def clean_phone_number(phone: str) -> str:
    """Clean phone number and format to E.164 for Kenya numbers."""
    cleaned = "".join([c for c in phone if c.isdigit() or c == "+"])
    
    # E.164 conversion for Kenya mobile numbers
    # e.g., 0712345678 -> +254712345678
    # e.g., 712345678 -> +254712345678
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "+254" + cleaned[1:]
    elif cleaned.startswith("7") and len(cleaned) == 9:
        cleaned = "+254" + cleaned
    elif not cleaned.startswith("+") and cleaned.startswith("254") and len(cleaned) == 12:
        cleaned = "+" + cleaned
        
    return cleaned


async def process_contacts_csv_import(
    user_id: uuid.UUID,
    file_path: str,
    group_id: Optional[uuid.UUID] = None,
    import_id: Optional[str] = None
):
    """
    Parses a CSV file from disk in batches, cleans phone numbers,
    and performs bulk database insertions.
    """
    logger.info(f"Starting CSV import background task for user_id={user_id}, file={file_path}")
    
    if not os.path.exists(file_path):
        logger.error(f"Import file not found: {file_path}")
        return

    async with async_session() as db:
        try:
            # Verify group belongs to user if group_id is provided
            target_group_name = None
            if group_id:
                group_res = await db.execute(
                    select(ContactGroup).where(ContactGroup.id == group_id, ContactGroup.user_id == user_id)
                )
                group = group_res.scalar_one_or_none()
                if not group:
                    logger.error(f"Specified contact group {group_id} not found for user {user_id}. Resetting to None.")
                    group_id = None
                else:
                    target_group_name = group.name

            # Open file and parse
            success_count = 0
            fail_count = 0
            batch_size = 1000
            
            contacts_batch = []
            group_members_batch = []

            # Open file with 'utf-8-sig' to automatically strip Excel BOM signatures
            with open(file_path, "r", encoding="utf-8-sig", errors="ignore") as f:
                # Read sample to detect dialect & header
                sample = f.read(4096)
                f.seek(0)
                
                dialect = None
                has_header = False
                try:
                    dialect = csv.Sniffer().sniff(sample, delimiters=[',', ';', '\t', '|'])
                    has_header = csv.Sniffer().has_header(sample)
                except Exception:
                    pass

                f.seek(0)
                if dialect:
                    reader = csv.reader(f, dialect)
                else:
                    reader = csv.reader(f)
                
                # Default indices
                name_idx = 0
                phone_idx = 1
                email_idx = 2
                headers = []
                
                if has_header:
                    header = next(reader, [])
                    headers = header
                    # Lowercase columns to find indices
                    header_lower = [col.lower().strip() for col in header]
                    
                    # Try matching typical names
                    phone_names = ["phone", "mobile", "number", "telephone", "phone number", "msisdn", "recipient"]
                    name_names = ["name", "full name", "fullname", "contact name", "first name", "username"]
                    email_names = ["email", "e-mail", "email address"]
                    
                    for p_name in phone_names:
                        if p_name in header_lower:
                            phone_idx = header_lower.index(p_name)
                            break
                    for n_name in name_names:
                        if n_name in header_lower:
                            name_idx = header_lower.index(n_name)
                            break
                    for e_name in email_names:
                        if e_name in header_lower:
                            email_idx = header_lower.index(e_name)
                            break

                # Query existing contacts to prevent duplicate phones in this import
                # Note: For massive databases, we'd query per batch, but here we can load existing phones into a set
                existing_res = await db.execute(
                    select(Contact.phone).where(Contact.user_id == user_id, Contact.deleted_at.is_(None))
                )

                existing_phones = set(existing_res.scalars().all())

                from app.utils.import_stream import import_queues
                import_queue = import_queues.get(import_id) if import_id else None

                row_idx = 1
                for row in reader:
                    if not row:
                        row_idx += 1
                        continue
                    
                    # Resolve column indices dynamically based on row structure
                    current_phone_idx = phone_idx
                    current_name_idx = name_idx
                    current_email_idx = email_idx
                    
                    if len(row) == 1:
                        current_phone_idx = 0
                        name = "Unnamed"
                        raw_phone = row[0].strip()
                        email = None
                    else:
                        if current_phone_idx >= len(row):
                            current_phone_idx = 0
                        if current_name_idx >= len(row):
                            current_name_idx = -1
                            
                        raw_phone = row[current_phone_idx].strip()
                        name = row[current_name_idx].strip() if (current_name_idx >= 0 and len(row) > current_name_idx) else "Unnamed"
                        email = row[current_email_idx].strip() if (current_email_idx < len(row) and row[current_email_idx].strip()) else None
                    
                    cleaned_phone = clean_phone_number(raw_phone)
                    
                    # Simple validation
                    if not cleaned_phone or len(cleaned_phone) < 8 or len(cleaned_phone) > 18:
                        fail_count += 1
                        if import_queue and row_idx <= 250:
                            await import_queue.put(f"❌ [INVALID] Row {row_idx}: {name} -> Invalid format '{raw_phone}'")
                        row_idx += 1
                        continue
                    
                    # Avoid duplicates
                    if cleaned_phone in existing_phones:
                        fail_count += 1
                        if import_queue and row_idx <= 250:
                            await import_queue.put(f"⚠️ [SKIP] Row {row_idx}: Duplicate number {cleaned_phone} ignored")
                        row_idx += 1
                        continue

                    # Mark phone as added in this run
                    existing_phones.add(cleaned_phone)
                    
                    custom_attrs = {}
                    if has_header and headers:
                        for col_idx, val in enumerate(row):
                            if col_idx not in (phone_idx, name_idx, email_idx) and col_idx < len(headers):
                                col_name = headers[col_idx].strip()
                                if col_name:
                                    custom_attrs[col_name] = val.strip()

                    contact_id = uuid.uuid4()
                    contacts_batch.append({
                        "id": contact_id,
                        "user_id": user_id,
                        "phone": cleaned_phone,
                        "name": name if name else "Unnamed",
                        "email": email,
                        "notes": "Imported via CSV",
                        "custom_attributes": custom_attrs,
                        "created_at": datetime.utcnow()
                    })

                    if group_id:
                        group_members_batch.append({
                            "contact_id": contact_id,
                            "group_id": group_id
                        })

                    if import_queue:
                        if row_idx <= 250:
                            await import_queue.put(f"✔ [CLEAN] Row {row_idx}: {name} -> {cleaned_phone} (Success)")
                        elif row_idx % 100 == 0:
                            await import_queue.put(f"⚡ [BATCH] Processed {row_idx} rows...")

                    row_idx += 1

                    # If batch is full, execute bulk inserts
                    if len(contacts_batch) >= batch_size:
                        await db.execute(insert(Contact), contacts_batch)
                        if group_members_batch:
                            await db.execute(contact_group_members.insert(), group_members_batch)
                        await db.commit()
                        
                        success_count += len(contacts_batch)
                        contacts_batch.clear()
                        group_members_batch.clear()
                        
                        # yield loop control
                        await asyncio.sleep(0.01)

                # Insert remaining
                if contacts_batch:
                    await db.execute(insert(Contact), contacts_batch)
                    if group_members_batch:
                        await db.execute(contact_group_members.insert(), group_members_batch)
                    await db.commit()
                    success_count += len(contacts_batch)

                if import_queue:
                    await import_queue.put("⚙️ [DATABASE] Executing SQL batch bulk insert...")
                    await import_queue.put(f"💾 [BULK] Committed {success_count} records successfully!")
                    await import_queue.put("✨ [COMPLETE] Background processing completed!")

            logger.info(f"CSV import complete. Success: {success_count}, Skips/Fails: {fail_count}")

            # Send welcome notification to user
            title = "Contacts Imported successfully! 👥"
            msg = f"Added {success_count:,} contacts."
            if target_group_name:
                msg += f" Added to group '{target_group_name}'."
            if fail_count > 0:
                msg += f" Skipped {fail_count:,} duplicates or invalid rows."
                
            db.add(Notification(
                user_id=user_id,
                title=title,
                message=msg,
                type="success",
                action_url="/dashboard/contacts"
            ))
            await db.commit()

        except Exception as e:
            logger.exception(f"Unhandled error during CSV import background task: {e}")
            from app.utils.import_stream import import_queues
            import_queue = import_queues.get(import_id) if import_id else None
            if import_queue:
                await import_queue.put(f"❌ [FATAL] Exception during record stream: {str(e)}")
            try:
                await db.rollback()
                db.add(Notification(
                    user_id=user_id,
                    title="Contacts Import Failed ❌",
                    message=f"An error occurred while importing your contacts: {str(e)}",
                    type="error",
                    action_url="/dashboard/contacts"
                ))
                await db.commit()
            except Exception as nested_e:
                logger.error(f"Failed to record import error notification: {nested_e}")
        finally:
            # Clean up temp file
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Cleaned up temp import file: {file_path}")
            except Exception as cleanup_e:
                logger.error(f"Failed to clean up temp file {file_path}: {cleanup_e}")
