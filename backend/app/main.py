"""Trackom SaaS Backend - FastAPI Application."""

import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import init_db, seed_demo_user
from app.routers import auth, users, blog, contacts, sms, api_keys, campaigns, wallet, notifications, inquiry, sender_ids, admin, reseller, templates, public_services
from app.services.campaign_worker import scheduled_campaign_monitor_loop


# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('trackom')

from app.utils.limiter import limiter
settings = get_settings()



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Guard against weak JWT secret keys in production
    if settings.ENVIRONMENT == "production" and settings.SECRET_KEY in (
        "change-me-in-production-use-openssl-rand-hex-32",
        "your-secret-key-change-in-production",
        ""
    ):
        logger.critical("FATAL: Weak or default SECRET_KEY detected in production!")
        raise RuntimeError("Production deployment requires a unique, secure SECRET_KEY.")

    # Startup: create tables (dev only; use Alembic migrations in production)
    if settings.ENVIRONMENT != "production":
        await init_db()
        await seed_demo_user()
    
    # Start background scheduled campaigns monitor
    monitor_task = asyncio.create_task(scheduled_campaign_monitor_loop())
    
    yield
    
    # Shutdown: cancel background monitor
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )


# CORS Configuration
# WARNING: In production, configure FRONTEND_URL to only allow trusted domain origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# ── Routes ──
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(blog.router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1")
app.include_router(sms.router, prefix="/api/v1")
app.include_router(api_keys.router, prefix="/api/v1")
app.include_router(campaigns.router, prefix="/api/v1")
app.include_router(wallet.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(inquiry.router, prefix="/api/v1")
app.include_router(sender_ids.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(reseller.router, prefix="/api/v1")
app.include_router(templates.router, prefix="/api/v1")
app.include_router(public_services.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
