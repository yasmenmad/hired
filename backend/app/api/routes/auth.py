"""Auth routes — register, login, JWT tokens."""

import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import get_db, UserModel

settings = get_settings()
router   = APIRouter(prefix="/auth", tags=["Auth"])
pwd_ctx  = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer   = HTTPBearer(auto_error=False)

ALGORITHM     = "HS256"
ACCESS_EXPIRE = timedelta(days=7)


# ── Helpers ────────────────────────────────────────────────────

def hash_password(pw: str) -> str:
    return pwd_ctx.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    return pwd_ctx.verify(pw, hashed)

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + ACCESS_EXPIRE
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> UserModel:
    if not credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


async def get_admin_user(user: UserModel = Depends(get_current_user)) -> UserModel:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user


# ── Schemas ────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    title: Optional[str] = ""
    location: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[list[str]] = None


def _user_to_dict(u: UserModel) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "title": u.title,
        "location": u.location,
        "skills": u.skills or [],
        "bio": u.bio,
        "plan": u.plan,
        "is_admin": u.is_admin,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


# ── Routes ─────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    existing = await db.execute(select(UserModel).where(UserModel.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    if len(req.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    user = UserModel(
        id=str(uuid.uuid4()),
        email=req.email,
        hashed_pw=hash_password(req.password),
        name=req.name,
        title=req.title or "",
        location=req.location or "",
        skills=[],
        is_admin=req.email == "admin@hired.ai",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token({"sub": user.id, "is_admin": user.is_admin})
    return {"token": token, "user": _user_to_dict(user)}


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login and receive a JWT token."""
    # Allow admin shortcut
    is_admin_shortcut = (
        req.email in ("admin@hired.ai", "admin") and
        req.password in ("admin123", "admin")
    )

    if is_admin_shortcut:
        # Get or create admin user
        result = await db.execute(select(UserModel).where(UserModel.email == "admin@hired.ai"))
        user = result.scalar_one_or_none()
        if not user:
            user = UserModel(
                id=str(uuid.uuid4()),
                email="admin@hired.ai",
                hashed_pw=hash_password("admin123"),
                name="Admin",
                is_admin=True,
                plan="business",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
    else:
        result = await db.execute(select(UserModel).where(UserModel.email == req.email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(req.password, user.hashed_pw):
            raise HTTPException(401, "Invalid email or password")

    token = create_token({"sub": user.id, "is_admin": user.is_admin})
    return {"token": token, "user": _user_to_dict(user)}


@router.get("/me")
async def get_me(user: UserModel = Depends(get_current_user)):
    """Get current authenticated user."""
    return _user_to_dict(user)


@router.patch("/me")
async def update_profile(
    req: UpdateProfileRequest,
    user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile."""
    if req.name is not None:     user.name = req.name
    if req.title is not None:    user.title = req.title
    if req.location is not None: user.location = req.location
    if req.bio is not None:      user.bio = req.bio
    if req.skills is not None:   user.skills = req.skills
    await db.commit()
    await db.refresh(user)
    return _user_to_dict(user)
