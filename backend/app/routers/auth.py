from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token, get_current_user
from app.repositories.user_repo import UserRepository
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    if repo.get_by_email(data.email):
        raise HTTPException(400, "Email déjà utilisé")
    user = repo.create(data)
    return user

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(data.email)
    if not user or not repo.verify_password(data.mot_de_passe, user.mot_de_passe):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    if user.statut == "banni":
        raise HTTPException(403, "Votre compte a été banni")
    repo.update_last_login(user.id)
    access  = create_access_token({"sub": user.id, "role": user.role})
    refresh = create_refresh_token({"sub": user.id})
    return TokenResponse(access_token=access, refresh_token=refresh)

@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Token refresh invalide")
    access  = create_access_token({"sub": payload["sub"]})
    refresh = create_refresh_token({"sub": payload["sub"]})
    return TokenResponse(access_token=access, refresh_token=refresh)

@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)):
    return current_user
