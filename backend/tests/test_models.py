"""Tests for database models — creation and defaults."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.notification import Notification
from app.models.transaction import Transaction
from app.models.api_key import ApiKey
from app.models.campaign import Campaign
from app.models.blog import BlogPost, BlogCategory


class TestUserModel:
    async def test_create_user_defaults(self, db_session: AsyncSession):
        user = User(email="model@test.com", full_name="Model Test", hashed_password="fake")
        db_session.add(user)
        await db_session.flush()
        assert user.id is not None
        assert user.account_type == "business"
        assert user.plan == "starter"
        assert user.sms_balance == 10000
        assert user.is_active is True
        assert user.is_verified is False

    async def test_user_repr(self):
        u = User(email="repr@test.com", full_name="Repr")
        assert "repr@test.com" in repr(u)


class TestApiKeyModel:
    def test_generate_key_format(self):
        key = ApiKey.generate_key()
        assert key.startswith("trk_")
        assert len(key) == 52  # trk_ + 48 hex chars

    def test_generate_key_unique(self):
        k1 = ApiKey.generate_key()
        k2 = ApiKey.generate_key()
        assert k1 != k2


class TestNotificationModel:
    async def test_create_notification(self, db_session: AsyncSession):
        user = User(email="notif@test.com", full_name="Notif User", hashed_password="x")
        db_session.add(user)
        await db_session.flush()
        notif = Notification(user_id=user.id, title="Test", message="Hello", type="info")
        db_session.add(notif)
        await db_session.flush()
        assert notif.id is not None
        assert notif.is_read is False


class TestBlogModels:
    async def test_create_category_and_post(self, db_session: AsyncSession):
        cat = BlogCategory(name="Tech", slug="tech")
        db_session.add(cat)
        await db_session.flush()
        post = BlogPost(title="Hello World", slug="hello-world", content="# Hi", category_id=cat.id)
        db_session.add(post)
        await db_session.flush()
        assert post.id is not None
        assert post.is_published is False
        assert post.view_count == 0


class TestCampaignModel:
    async def test_campaign_defaults(self, db_session: AsyncSession):
        user = User(email="camp@test.com", full_name="Camp User", hashed_password="x")
        db_session.add(user)
        await db_session.flush()
        camp = Campaign(user_id=user.id, name="Test Campaign", message_content="Hi!", sender_id="TRACKOM")
        db_session.add(camp)
        await db_session.flush()
        assert camp.status == "draft"
        assert camp.total_recipients == 0
        assert camp.sent_count == 0
