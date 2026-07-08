"""Auth router - register, login, refresh, forgot-password, Google OAuth."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from app.utils.limiter import limiter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.models.transaction import Transaction
from app.models.sender_id import SenderIdRequest
from app.middleware.auth import get_current_user
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    ForgotPasswordRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
    LoginResponse,
    Login2FaRequest,
    TwoFactorSetupResponse,
    TwoFactorCodeRequest,
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


@router.post("/login", response_model=LoginResponse)
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

    # If user has 2FA enabled, return a temporary token instead
    if user.is_2fa_enabled:
        from app.utils.security import create_temp_2fa_token
        temp_token = create_temp_2fa_token(str(user.id))
        
        # If method is SMS or Email, generate and send code
        if user.two_factor_method in ("sms", "email"):
            import secrets
            from datetime import datetime, timedelta
            code = f"{secrets.randbelow(1000000):06d}"
            user.otp_code = code
            user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
            await db.commit()
            
            if user.two_factor_method == "sms":
                print(f"[SMS 2FA LOGIN] Code: {code} sent to phone: {user.phone}")
            else:
                print(f"[EMAIL 2FA LOGIN] Code: {code} sent to email: {user.email}")

        return LoginResponse(require_2fa=True, temp_token=temp_token, method=user.two_factor_method)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return LoginResponse(
        require_2fa=False,
        access_token=access_token,
        refresh_token=refresh_token
    )


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


@router.post("/login/2fa", response_model=TokenResponse)
async def login_2fa(data: Login2FaRequest, db: AsyncSession = Depends(get_db)):
    """Verify 2FA login code and issue access token."""
    from app.utils.security import decode_token
    import pyotp
    import uuid

    payload = decode_token(data.temp_token)
    if not payload or payload.get("scope") != "2fa_login":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired temporary token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    # Fetch user
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active or not user.is_2fa_enabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or 2FA not enabled")

    # Verify code
    if user.two_factor_method == "totp":
        if not user.totp_secret:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="TOTP secret not configured")
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(data.code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA verification code")
    else:
        from datetime import datetime
        if not user.otp_code or not user.otp_expires_at or datetime.utcnow() > user.otp_expires_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code expired or not sent")
        if user.otp_code != data.code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA verification code")
        # Clear code
        user.otp_code = None
        user.otp_expires_at = None
        await db.commit()

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    method: str = Query("totp", pattern="^(totp|sms|email)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a TOTP secret or send setup code for SMS/Email 2FA."""
    import pyotp
    import secrets
    from datetime import datetime, timedelta

    result = await db.execute(select(User).where(User.id == current_user.id))
    db_user = result.scalar_one()
    db_user.two_factor_method = method

    if method == "totp":
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        otpauth_url = totp.provisioning_uri(name=current_user.email, issuer_name="Trackom")
        db_user.totp_secret = secret
        await db.commit()
        return TwoFactorSetupResponse(secret=secret, otpauth_url=otpauth_url)
    
    # SMS or Email setup code
    code = f"{secrets.randbelow(1000000):06d}"
    db_user.otp_code = code
    db_user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    await db.commit()

    if method == "sms":
        if not current_user.phone:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please configure a phone number in your profile before enabling SMS 2FA.")
        print(f"[SMS 2FA SETUP] Code: {code} sent to phone: {current_user.phone}")
        return TwoFactorSetupResponse(phone=current_user.phone)
    else:
        print(f"[EMAIL 2FA SETUP] Code: {code} sent to email: {current_user.email}")
        return TwoFactorSetupResponse(email=current_user.email)


@router.post("/2fa/enable")
async def enable_2fa(
    data: TwoFactorCodeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify code and enable 2FA."""
    import pyotp
    from datetime import datetime

    result = await db.execute(select(User).where(User.id == current_user.id))
    db_user = result.scalar_one()

    if db_user.two_factor_method == "totp":
        if not db_user.totp_secret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA setup not initiated.")
        totp = pyotp.TOTP(db_user.totp_secret)
        if not totp.verify(data.code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA verification code")
    else:
        if not db_user.otp_code or not db_user.otp_expires_at or datetime.utcnow() > db_user.otp_expires_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code expired or not sent")
        if db_user.otp_code != data.code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA verification code")
        # Clear code
        db_user.otp_code = None
        db_user.otp_expires_at = None

    db_user.is_2fa_enabled = True
    await db.commit()

    return {"message": "Two-factor authentication enabled successfully."}


@router.post("/2fa/disable/request")
async def disable_2fa_request(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a verification code to disable SMS or Email 2FA."""
    import secrets
    from datetime import datetime, timedelta

    result = await db.execute(select(User).where(User.id == current_user.id))
    db_user = result.scalar_one()

    if not db_user.is_2fa_enabled or db_user.two_factor_method == "totp":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request not applicable for current 2FA settings.")

    code = f"{secrets.randbelow(1000000):06d}"
    db_user.otp_code = code
    db_user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    await db.commit()

    if db_user.two_factor_method == "sms":
        print(f"[SMS 2FA DISABLE] Code: {code} sent to phone: {db_user.phone}")
    else:
        print(f"[EMAIL 2FA DISABLE] Code: {code} sent to email: {db_user.email}")

    return {"message": "Verification code sent successfully."}


@router.post("/2fa/disable")
async def disable_2fa(
    data: TwoFactorCodeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Disable 2FA after verifying the code."""
    import pyotp
    from datetime import datetime

    result = await db.execute(select(User).where(User.id == current_user.id))
    db_user = result.scalar_one()

    if not db_user.is_2fa_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled.")

    if db_user.two_factor_method == "totp":
        if not db_user.totp_secret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not configured.")
        totp = pyotp.TOTP(db_user.totp_secret)
        if not totp.verify(data.code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA verification code")
    else:
        if not db_user.otp_code or not db_user.otp_expires_at or datetime.utcnow() > db_user.otp_expires_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code expired or not sent")
        if db_user.otp_code != data.code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA verification code")
        # Clear code
        db_user.is_2fa_enabled = False
        db_user.otp_code = None
        db_user.otp_expires_at = None
        await db.commit()
        return {"message": "Two-factor authentication disabled successfully."}

    db_user.is_2fa_enabled = False
    db_user.totp_secret = None
    await db.commit()

    return {"message": "Two-factor authentication disabled successfully."}

