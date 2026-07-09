"""Test fixtures - in-memory SQLite database for testing."""

import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.utils.limiter import limiter
limiter.enabled = False
from app.main import app


# In-memory SQLite with shared cache for multi-connection worker visibility
TEST_DATABASE_URL = "sqlite+aiosqlite:///file:testdb?mode=memory&cache=shared"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Override database sessionmaker so that the background workers write to the test DB
import app.database as app_db
app_db.async_session = TestSession


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def client():
    """Async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_client(client: AsyncClient):
    """Authenticated client with a pre-registered user."""
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Auth User",
        "email": "auth@test.com",
        "password": "TestPass123!",
        "account_type": "business",
    })
    token = resp.json()["access_token"]
    
    # Update balance to 10000 for test execution, since welcome bonus is removed by default
    from app.models.user import User
    from sqlalchemy import update
    async with TestSession() as session:
        await session.execute(
            update(User).where(User.email == "auth@test.com").values(
                sms_balance=10000,
                sandbox_sms_balance=10000
            )
        )
        await session.commit()
        
    client.headers["Authorization"] = f"Bearer {token}"
    yield client


@pytest.fixture
async def admin_client(client: AsyncClient):
    """Authenticated client with a pre-registered admin user."""
    resp = await client.post("/api/v1/auth/register", json={
        "full_name": "Admin User",
        "email": "admin@test.com",
        "password": "TestPass123!",
        "account_type": "business",
    })
    token = resp.json()["access_token"]
    
    # Update is_superuser to True in database
    from app.models.user import User
    from sqlalchemy import update
    async with TestSession() as session:
        await session.execute(
            update(User).where(User.email == "admin@test.com").values(is_superuser=True)
        )
        await session.commit()
        
    client.headers["Authorization"] = f"Bearer {token}"
    yield client



@pytest.fixture
async def db_session():
    """Direct database session for model tests."""
    async with TestSession() as session:
        yield session
        await session.rollback()
