"""Models package - import all models for Alembic discovery."""

from app.models.user import User
from app.models.api_key import ApiKey
from app.models.api_key_log import ApiKeyLog
from app.models.contact import Contact, ContactGroup, contact_group_members
from app.models.sms import SmsMessage
from app.models.campaign import Campaign
from app.models.transaction import Transaction
from app.models.notification import Notification
from app.models.blog import BlogPost, BlogCategory
from app.models.inquiry import ContactInquiry
from app.models.sender_id import SenderIdRequest, AdvantaSenderId
from app.models.gateway import SmsGateway
from app.models.template import SmsTemplate
from app.models.incoming import IncomingSms
from app.models.token_blacklist import BlacklistedToken
from app.models.audit_log import AuditLog
from app.models.email_verification import EmailVerification

__all__ = [
    "User",
    "ApiKey",
    "ApiKeyLog",
    "Contact",
    "ContactGroup",
    "contact_group_members",
    "SmsMessage",
    "Campaign",
    "Transaction",
    "Notification",
    "BlogPost",
    "BlogCategory",
    "ContactInquiry",
    "SenderIdRequest",
    "AdvantaSenderId",
    "SmsGateway",
    "SmsTemplate",
    "IncomingSms",
    "BlacklistedToken",
    "AuditLog",
    "EmailVerification",
]
