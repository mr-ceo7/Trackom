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
    """Seed a default demo user account for testing purposes."""
    from app.models.user import User
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
