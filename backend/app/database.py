"""Trackom SaaS Backend - Database setup."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
)


async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency that provides a database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables (for development only; use Alembic in production)."""
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS include_opt_out BOOLEAN DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100) NULL;"))
        await conn.execute(text("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN NOT NULL DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS sandbox_sms_balance INTEGER NOT NULL DEFAULT 10000;"))
        await conn.execute(text("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN NOT NULL DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN NOT NULL DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN NOT NULL DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE sender_id_requests ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN NOT NULL DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN NOT NULL DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE incoming_sms ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN NOT NULL DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN NOT NULL DEFAULT TRUE;"))



async def seed_demo_user():
    """Seed a default demo user account for testing purposes."""
    from app.models.user import User
    from app.models.sender_id import SenderIdRequest
    from app.utils.security import hash_password
    from sqlalchemy import select

    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == "demo@trackom.co.ke"))
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            demo = User(
                email="demo@trackom.co.ke",
                hashed_password=hash_password("Password123!"),
                full_name="Demo User",
                phone="+254712345678",
                company="Trackom Demo Ltd",
                account_type="business",
                plan="starter",
                sms_balance=25000,
                is_active=True,
                is_verified=True
            )
            session.add(demo)
            await session.commit()
            
            # Fetch again to get the saved user with ID
            result = await session.execute(select(User).where(User.email == "demo@trackom.co.ke"))
            existing_user = result.scalar_one()

        # Seed TRACKOM sender ID for demo user
        result_sender = await session.execute(
            select(SenderIdRequest).where(
                SenderIdRequest.user_id == existing_user.id,
                SenderIdRequest.sender_id == "TRACKOM"
            )
        )
        if not result_sender.scalar_one_or_none():
            demo_sender = SenderIdRequest(
                user_id=existing_user.id,
                sender_id="TRACKOM",
                purpose="System Default Sender ID",
                status="approved"
            )
            session.add(demo_sender)
            await session.commit()

        # Seed default admin user
        result_admin = await session.execute(select(User).where(User.email == "admin@trackom.co.ke"))
        existing_admin = result_admin.scalar_one_or_none()
        if not existing_admin:
            admin_user = User(
                email="admin@trackom.co.ke",
                hashed_password=hash_password("Password123!"),
                full_name="Trackom Admin",
                phone="+254788888888",
                company="Trackom Global",
                account_type="business",
                plan="enterprise",
                sms_balance=999999,
                is_active=True,
                is_verified=True,
                is_superuser=True
            )
            session.add(admin_user)
            await session.commit()
            
            # Fetch again to get the saved admin with ID
            result_admin = await session.execute(select(User).where(User.email == "admin@trackom.co.ke"))
            existing_admin = result_admin.scalar_one()

        # Seed TRACKOM sender ID for admin user
        result_admin_sender = await session.execute(
            select(SenderIdRequest).where(
                SenderIdRequest.user_id == existing_admin.id,
                SenderIdRequest.sender_id == "TRACKOM"
            )
        )
        if not result_admin_sender.scalar_one_or_none():
            admin_sender = SenderIdRequest(
                user_id=existing_admin.id,
                sender_id="TRACKOM",
                purpose="System Default Sender ID",
                status="approved"
            )
            session.add(admin_sender)
            await session.commit()

        # Seed default SMS Gateway (AdvantaSMS)
        from app.models.gateway import SmsGateway
        result_gw = await session.execute(select(SmsGateway).where(SmsGateway.name == "AdvantaSMS Gateway"))
        if not result_gw.scalar_one_or_none():
            default_gw = SmsGateway(
                name="AdvantaSMS Gateway",
                api_url=settings.ADVANTA_BASE_URL,
                api_key=settings.ADVANTA_API_KEY,
                weight=100,
                is_active=True
            )
            session.add(default_gw)
            await session.commit()
