"""Contact Inquiry API Router - public route for contact forms."""

from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.inquiry import ContactInquiry
from app.schemas.inquiry import ContactInquiryCreate, ContactInquiryResponse
from app.utils.limiter import limiter

router = APIRouter(prefix="/inquiries", tags=["Contact Inquiries"])


@router.post("", response_model=ContactInquiryResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def create_inquiry(
    request: Request,
    data: ContactInquiryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Public endpoint to log a customer support or sales inquiry.
    """
    inquiry = ContactInquiry(
        full_name=data.full_name,
        email=data.email,
        company=data.company,
        phone=data.phone,
        inquiry_type=data.inquiry_type,
        subject=data.subject,
        message=data.message,
        status="new"
    )
    db.add(inquiry)
    await db.flush()
    return inquiry
