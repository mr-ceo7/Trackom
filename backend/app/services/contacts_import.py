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
    # e.g., 112345678 -> +254112345678
    # e.g., 254712345678 -> +254712345678
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "+254" + cleaned[1:]
    elif (cleaned.startswith("7") or cleaned.startswith("1")) and len(cleaned) == 9:
        cleaned = "+254" + cleaned
    elif not cleaned.startswith("+") and cleaned.startswith("254") and len(cleaned) == 12:
        cleaned = "+" + cleaned
        
    return cleaned


def clean_excel_value(val) -> str:
    if val is None:
        return ""
    if isinstance(val, float):
        if val.is_integer():
            return str(int(val))
        return str(val)
    return str(val).strip()


def convert_xlsx_to_csv(xlsx_path: str, csv_path: str):
    import openpyxl
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    sh = wb.active
    if not sh:
        raise ValueError("Excel file has no active sheets.")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        for row in sh.iter_rows(values_only=True):
            row_str = [clean_excel_value(cell) for cell in row]
            if any(cell != "" for cell in row_str):
                writer.writerow(row_str)


def convert_xls_to_csv(xls_path: str, csv_path: str):
    import xlrd
    wb = xlrd.open_workbook(xls_path)
    sh = wb.sheet_by_index(0)
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        for row_idx in range(sh.nrows):
            row = sh.row_values(row_idx)
            row_str = [clean_excel_value(cell) for cell in row]
            if any(cell != "" for cell in row_str):
                writer.writerow(row_str)


async def process_contacts_csv_import(
    user_id: uuid.UUID,
    file_path: str,
    group_id: Optional[uuid.UUID] = None,
    import_id: Optional[str] = None
):
    """
    Parses a CSV/Excel file from disk in batches, cleans phone numbers,
    and performs bulk database insertions.
    """
    logger.info(f"Starting import background task for user_id={user_id}, file={file_path}")
    
    # Detect Excel files and convert to CSV
    original_file_path = file_path
    temp_csv_path = None
    
    _, ext = os.path.splitext(file_path.lower())
    if ext in ('.xlsx', '.xls'):
        from app.utils.import_stream import import_queues
        import_queue = import_queues.get(import_id) if import_id else None
        if import_queue:
            await import_queue.put(f"📂 [EXCEL] Converting Excel ({ext}) spreadsheet to CSV structure...")
        
        try:
            temp_csv_path = file_path + ".converted.csv"
            if ext == '.xlsx':
                convert_xlsx_to_csv(file_path, temp_csv_path)
            else:
                convert_xls_to_csv(file_path, temp_csv_path)
            file_path = temp_csv_path
            if import_queue:
                await import_queue.put("✅ [EXCEL] Conversion complete. Proceeding with database ingestion...")
        except Exception as e:
            logger.exception(f"Failed to convert Excel to CSV: {e}")
            if import_queue:
                await import_queue.put(f"❌ [FATAL] Excel conversion failed: {str(e)}")
            # Cleanup source file
            if os.path.exists(original_file_path):
                try:
                    os.remove(original_file_path)
                except Exception:
                    pass
            return

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
                # Read sample to detect dialect
                sample = f.read(4096)
                f.seek(0)
                
                dialect = None
                try:
                    dialect = csv.Sniffer().sniff(sample, delimiters=[',', ';', '\t', '|'])
                except Exception:
                    pass

                if dialect:
                    reader = csv.reader(f, dialect)
                else:
                    reader = csv.reader(f)
                
                has_header = False
                headers = []
                
                # Read first row to determine if it is a header
                first_row = next(reader, None)
                if first_row is not None:
                    header_lower = [str(col).lower().strip() for col in first_row]
                    
                    phone_keywords = ["phone", "mobile", "number", "telephone", "phone number", "msisdn", "recipient", "tel"]
                    name_keywords = ["name", "full name", "fullname", "contact", "first name", "last name", "username"]
                    email_keywords = ["email", "e-mail", "email address"]
                    
                    found_phone_idx = -1
                    found_name_idx = -1
                    found_email_idx = -1
                    
                    for idx, col in enumerate(header_lower):
                        if any(k == col or col.startswith(k) or col.endswith(k) for k in phone_keywords):
                            found_phone_idx = idx
                        elif any(k == col or col.startswith(k) or col.endswith(k) for k in name_keywords):
                            found_name_idx = idx
                        elif any(k == col or col.startswith(k) or col.endswith(k) for k in email_keywords):
                            found_email_idx = idx
                            
                    if found_phone_idx != -1 or found_name_idx != -1 or found_email_idx != -1:
                        # Found a header!
                        has_header = True
                        headers = first_row
                        phone_idx = found_phone_idx if found_phone_idx != -1 else 0
                        name_idx = found_name_idx if found_name_idx != -1 else 1
                        email_idx = found_email_idx if found_email_idx != -1 else 2
                    else:
                        # No header found. Reset reader and treat first row as data!
                        has_header = False
                        f.seek(0)
                        if dialect:
                            reader = csv.reader(f, dialect)
                        else:
                            reader = csv.reader(f)
                        
                        # Auto-detect indices based on cell contents of the first row
                        if len(first_row) > 0:
                            phone_scores = []
                            for col in first_row:
                                digits = "".join([c for c in str(col) if c.isdigit()])
                                phone_scores.append(len(digits))
                            
                            best_phone_idx = 0
                            max_digits = 0
                            for idx, score in enumerate(phone_scores):
                                if score > max_digits:
                                    max_digits = score
                                    best_phone_idx = idx
                                    
                            if max_digits >= 7:
                                phone_idx = best_phone_idx
                                name_idx = 1 if phone_idx == 0 else 0
                            else:
                                phone_idx = 1
                                name_idx = 0
                        else:
                            phone_idx = 1
                            name_idx = 0
                        email_idx = 2
                else:
                    phone_idx = 1
                    name_idx = 0
                    email_idx = 2

                # Query existing contacts to map phone to id and prevent duplicate contact creation
                existing_res = await db.execute(
                    select(Contact.id, Contact.phone).where(Contact.user_id == user_id, Contact.deleted_at.is_(None))
                )
                existing_contacts_map = {phone: cid for cid, phone in existing_res.all()}

                # Query existing group members to prevent duplicate associations
                existing_group_member_ids = set()
                if group_id:
                    member_res = await db.execute(
                        select(contact_group_members.c.contact_id).where(contact_group_members.c.group_id == group_id)
                    )
                    existing_group_member_ids = set(member_res.scalars().all())

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
                    
                    # Sanitize lengths to prevent database crashes due to oversized CSV fields
                    name = name[:255] if name else "Unnamed"
                    email = email[:255] if email else None
                    
                    cleaned_phone = clean_phone_number(raw_phone)[:20]
                    
                    # Simple validation
                    if not cleaned_phone or len(cleaned_phone) < 8 or len(cleaned_phone) > 18:
                        fail_count += 1
                        if import_queue and row_idx <= 250:
                            await import_queue.put(f"❌ [INVALID] Row {row_idx}: {name} -> Invalid format '{raw_phone}'")
                        row_idx += 1
                        continue
                    
                    # Handle duplicate contacts
                    if cleaned_phone in existing_contacts_map:
                        existing_contact_id = existing_contacts_map[cleaned_phone]
                        if group_id and existing_contact_id not in existing_group_member_ids:
                            group_members_batch.append({
                                "contact_id": existing_contact_id,
                                "group_id": group_id
                            })
                            existing_group_member_ids.add(existing_contact_id)
                            success_count += 1
                            if import_queue and row_idx <= 250:
                                await import_queue.put(f"✔ [GROUP] Row {row_idx}: Added existing contact {name} ({cleaned_phone}) to segment")
                        else:
                            fail_count += 1
                            if import_queue and row_idx <= 250:
                                await import_queue.put(f"⚠️ [SKIP] Row {row_idx}: Duplicate number {cleaned_phone} ignored")
                        row_idx += 1
                        continue

                    # Mark phone as added in this run
                    contact_id = uuid.uuid4()
                    existing_contacts_map[cleaned_phone] = contact_id
                    if group_id:
                        existing_group_member_ids.add(contact_id)
                    
                    custom_attrs = {}
                    if has_header and headers:
                        for col_idx, val in enumerate(row):
                            if col_idx not in (phone_idx, name_idx, email_idx) and col_idx < len(headers):
                                col_name = headers[col_idx].strip()
                                if col_name:
                                    custom_attrs[col_name] = val.strip()

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

                    success_count += 1

                    if import_queue:
                        if row_idx <= 250:
                            await import_queue.put(f"✔ [CLEAN] Row {row_idx}: {name} -> {cleaned_phone} (Success)")
                        elif row_idx % 100 == 0:
                            await import_queue.put(f"⚡ [BATCH] Processed {row_idx} rows...")

                    row_idx += 1

                    # If batch is full, execute bulk inserts
                    if len(contacts_batch) >= batch_size or len(group_members_batch) >= batch_size:
                        if contacts_batch:
                            await db.execute(insert(Contact), contacts_batch)
                        if group_members_batch:
                            await db.execute(contact_group_members.insert(), group_members_batch)
                        await db.commit()
                        
                        contacts_batch.clear()
                        group_members_batch.clear()
                        
                        # yield loop control
                        await asyncio.sleep(0.01)

                # Insert remaining
                if contacts_batch or group_members_batch:
                    if contacts_batch:
                        await db.execute(insert(Contact), contacts_batch)
                    if group_members_batch:
                        await db.execute(contact_group_members.insert(), group_members_batch)
                    await db.commit()

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

            # Publish real-time success event
            try:
                from app.services.event_bus import event_bus
                event_bus.publish(str(user_id), "contacts_import", {
                    "status": "success",
                    "message": msg,
                    "success_count": success_count,
                    "fail_count": fail_count
                })
            except Exception:
                pass

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

                # Publish real-time failure event
                try:
                    from app.services.event_bus import event_bus
                    event_bus.publish(str(user_id), "contacts_import", {
                        "status": "failed",
                        "message": f"An error occurred while importing your contacts: {str(e)}"
                    })
                except Exception:
                    pass
            except Exception as nested_e:
                logger.error(f"Failed to record import error notification: {nested_e}")
        finally:
            # Clean up temp files
            for p in (original_file_path, temp_csv_path):
                if p and os.path.exists(p):
                    try:
                        os.remove(p)
                        logger.info(f"Cleaned up temp import file: {p}")
                    except Exception as cleanup_e:
                        logger.error(f"Failed to clean up temp file {p}: {cleanup_e}")

