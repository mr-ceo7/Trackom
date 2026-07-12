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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)



async def seed_demo_user():
    """Seed system administrator account and required records."""
    from app.models.user import User
    from app.models.sender_id import SenderIdRequest
    from app.utils.security import hash_password
    from sqlalchemy import select, delete

    async with async_session() as session:
        # Delete old dummy accounts
        await session.execute(delete(User).where(User.email.in_(["demo@trackomgroup.com", "admin@trackomgroup.com"])))
        await session.commit()

        # Seed new admin user
        result_admin = await session.execute(select(User).where(User.email == "kassimmusa322@gmail.com"))
        existing_admin = result_admin.scalar_one_or_none()
        if not existing_admin:
            admin_user = User(
                email="kassimmusa322@gmail.com",
                hashed_password=hash_password("TrackoM23#321D"),
                full_name="Kassim Musa",
                phone="+254712345678",
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
            result_admin = await session.execute(select(User).where(User.email == "kassimmusa322@gmail.com"))
            existing_admin = result_admin.scalar_one()
        else:
            existing_admin.is_superuser = True
            existing_admin.plan = "enterprise"
            existing_admin.is_active = True
            existing_admin.is_verified = True
            await session.commit()

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

        # Seed Advanta approved Sender IDs
        from app.models.sender_id import AdvantaSenderId
        advantasms_ids = [
            ("GrandeAuto", "active"),
            ("HOPEMARTLTD", "active"),
            ("POTATOHead", "active"),
            ("ArvocapInfo", "active"),
            ("PapaJohns", "active"),
            ("ChknCottage", "active"),
            ("TERACREAT", "active"),
            ("ARVOCAP", "active"),
            ("GuruNanakH", "active"),
            ("AndroidPOS", "active"),
            ("SUNBRIM", "active"),
            ("EMENTORING", "active"),
            ("JOPEED_LTD", "active"),
            ("VISCAR", "active"),
            ("ADMGLGarage", "active"),
            ("KEMU_ALUMNI", "active"),
            ("MANGO", "active"),
            ("RELIABLELTD", "active"),
            ("VenasTips", "active"),
            ("PalmsBet", "inactive"),
            ("PETANNS", "active"),
        ]
        for sender_id, status in advantasms_ids:
            res_adv = await session.execute(
                select(AdvantaSenderId).where(AdvantaSenderId.sender_id == sender_id.upper())
            )
            if not res_adv.scalar_one_or_none():
                session.add(AdvantaSenderId(
                    sender_id=sender_id.upper(),
                    status=status
                ))
        await session.commit()
