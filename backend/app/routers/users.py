"""User router - profile management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.auth import UserResponse, UserUpdateRequest, ChangePasswordRequest
from app.utils.security import verify_password, hash_password

router = APIRouter(prefix="/users", tags=["Users"])


from sqlalchemy import select

async def resolve_user_branding(user: User, db: AsyncSession) -> dict:
    if user.parent_id:
        result = await db.execute(select(User).where(User.id == user.parent_id))
        parent = result.scalar_one_or_none()
        if parent:
            return {
                "logo_url": parent.custom_logo_url,
                "brand_name": parent.custom_brand_name,
                "primary_color": parent.custom_primary_color
            }
    return {
        "logo_url": user.custom_logo_url,
        "brand_name": user.custom_brand_name,
        "primary_color": user.custom_primary_color
    }


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the current user's profile."""
    current_user.branding = await resolve_user_branding(current_user, db)
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.flush()
    current_user.branding = await resolve_user_branding(current_user, db)
    return current_user


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account uses OAuth login. Set a password first.",
        )

    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(data.new_password)
    return {"message": "Password updated successfully"}
