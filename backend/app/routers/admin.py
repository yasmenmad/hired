from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_admin_user
from app.repositories.user_repo import UserRepository
from app.models.models import Notification, CV, SessionEntretien, Candidature, Utilisateur
from app.schemas.schemas import NotificationCreate, NotificationResponse, UserResponse
from typing import List
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    return {
        "total_utilisateurs": db.query(Utilisateur).count(),
        "utilisateurs_actifs": db.query(Utilisateur).filter(Utilisateur.statut == "actif").count(),
        "utilisateurs_bannis": db.query(Utilisateur).filter(Utilisateur.statut == "banni").count(),
        "total_cvs": db.query(CV).count(),
        "total_candidatures": db.query(Candidature).count(),
        "total_sessions": db.query(SessionEntretien).count(),
    }

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    return UserRepository(db).get_all()

@router.post("/users/{uid}/ban")
def ban(uid: str, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    UserRepository(db).ban(uid)
    return {"ok": True}

@router.post("/users/{uid}/unban")
def unban(uid: str, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    UserRepository(db).unban(uid)
    return {"ok": True}

@router.post("/notifications", response_model=NotificationResponse, status_code=201)
def send_notif(data: NotificationCreate, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    n = Notification(id=str(uuid.uuid4()), **data.model_dump())
    db.add(n); db.commit(); db.refresh(n)
    return n
