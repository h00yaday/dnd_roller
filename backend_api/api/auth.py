from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from core.config import settings
from core.limiter import RateLimiter
from core.security import create_access_token, get_password_hash, verify_password
from db.database import get_db
from db.models import User
from schemas.schemas import UserCreate, UserLogin, UserResponse
from services.character_service import CharacterService
from services.email_service import send_welcome_email

logger = logging.getLogger(__name__)

login_limiter = RateLimiter(capacity=5, refill_amount=1, refill_period_ms=10000)
router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(login_limiter)],
)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):

    await CharacterService.ensure_username_available(db, user_in.username)
    email_check_result = await db.execute(select(User).where(User.email == user_in.email))
    if email_check_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pwd = await get_password_hash(user_in.password)

    new_user = User(username=user_in.username, hashed_password=hashed_pwd, email=user_in.email)

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    try:
        logger.info(f"Attempting to send welcome email to {new_user.email} for user {new_user.username}")
        task = send_welcome_email.delay(new_user.email, new_user.username)
        logger.info(f"Welcome email task sent successfully. Task ID: {task.id}")
    except Exception as e:
        logger.exception(f"Failed to send welcome email task for user {new_user.id}: {type(e).__name__}: {e}")

    return new_user


@router.post("/login", dependencies=[Depends(login_limiter)])
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_login = UserLogin(username=form_data.username, password=form_data.password)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    result = await db.execute(select(User).where(User.username == user_login.username))
    user = result.scalar_one_or_none()

    if not user or not await verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    is_secure = settings.ENVIRONMENT == "production"
    samesite = "strict" if is_secure else "lax"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite=samesite,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    csrf_token = CharacterService.issue_csrf_token()
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=True,
        secure=is_secure,
        samesite=samesite,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {"access_token": access_token, "token_type": "bearer", "csrf_token": csrf_token}


@router.post("/logout")
async def logout(response: Response):
    is_secure = settings.ENVIRONMENT == "production"
    samesite = "strict" if is_secure else "lax"
    response.delete_cookie("access_token", samesite=samesite)
    response.delete_cookie("csrf_token", samesite=samesite)
    return {"message": "Logged out successfully"}