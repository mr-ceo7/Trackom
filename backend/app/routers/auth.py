"""Auth router - register, login, refresh, forgot-password, Google OAuth."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.utils.limiter import limiter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.models.transaction import Transaction
from app.models.sender_id import SenderIdRequest
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    ForgotPasswordRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Create user
    from app.routers.admin import load_system_settings
    settings = load_system_settings()
    welcome_balance = settings.get("welcomeCredits", 10000)

    user = User(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone,
        company=data.company,
        hashed_password=hash_password(data.password),
        account_type=data.account_type,
        sms_balance=welcome_balance,
    )
    db.add(user)
    await db.flush()  # Get user.id

    # Seed default approved 'TRACKOM' Sender ID
    db.add(SenderIdRequest(
        user_id=user.id,
        sender_id="TRACKOM",
        purpose="System Default Sender ID",
        status="approved"
    ))

    # Create welcome notification
    notification = Notification(
        user_id=user.id,
        title="Welcome to Trackom! 🎉",
        message=f"Your account has been created with {welcome_balance:,} free SMS credits. Start sending!",
        type="success",
        action_url="/dashboard",
    )
    db.add(notification)

    # Create signup bonus transaction
    transaction = Transaction(
        user_id=user.id,
        type="bonus",
        amount=0,
        sms_credits=welcome_balance,
        balance_after=welcome_balance,
        description=f"Welcome bonus - {welcome_balance:,} free SMS credits",
        status="completed",
    )
    db.add(transaction)

    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    email_clean = data.email.strip()
    password_clean = data.password.strip()

    result = await db.execute(select(User).where(User.email == email_clean))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(password_clean, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with Google OAuth2 ID token."""
    # Verify Google token
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={data.credential}"
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    google_data = resp.json()
    google_id = google_data.get("sub")
    email = google_data.get("email")
    name = google_data.get("name", "")
    picture = google_data.get("picture")

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided by Google")

    # Check if user exists by google_id or email
    result = await db.execute(select(User).where((User.google_id == google_id) | (User.email == email)))
    user = result.scalar_one_or_none()

    if user:
        # Link Google ID if not already linked
        if not user.google_id:
            user.google_id = google_id
            if picture and not user.avatar_url:
                user.avatar_url = picture
    else:
        # Create new user
        user = User(
            email=email,
            full_name=name,
            google_id=google_id,
            avatar_url=picture,
            is_verified=True,
            sms_balance=10000,
        )
        db.add(user)
        await db.flush()

        # Seed default approved 'TRACKOM' Sender ID
        db.add(SenderIdRequest(
            user_id=user.id,
            sender_id="TRACKOM",
            purpose="System Default Sender ID",
            status="approved"
        ))

        # Welcome notification + bonus
        db.add(Notification(
            user_id=user.id,
            title="Welcome to Trackom! 🎉",
            message="Your account has been created with 10,000 free SMS credits.",
            type="success",
            action_url="/dashboard",
        ))
        db.add(Transaction(
            user_id=user.id, type="bonus", amount=0, sms_credits=10000,
            balance_after=10000, description="Welcome bonus", status="completed",
        ))

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh an access token using a refresh token."""
    payload = decode_token(data.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    try:
        import uuid
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def forgot_password(request: Request, data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send a password reset email (simulated for now)."""
    # Always return success to prevent email enumeration
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user:
        # In production: generate reset token, send email
        # For now, create a notification
        db.add(Notification(
            user_id=user.id,
            title="Password Reset Requested",
            message="A password reset was requested for your account. Check your email for instructions.",
            type="info",
        ))

    return {"message": "If an account exists with this email, a reset link has been sent."}


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.token_blacklist import blacklist_token

security = HTTPBearer()



@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Log out the current user by blacklisting their access token."""
    token = credentials.credentials
    payload = decode_token(token)
    if payload:
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            expire_dt = datetime.fromtimestamp(exp, tz=timezone.utc)
            blacklist_token(jti, expire_dt)
    return {"message": "Logged out successfully"}

