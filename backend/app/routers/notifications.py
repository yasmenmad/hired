from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Notification
from app.schemas.schemas import NotificationResponse
from typing import List

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_notifs(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Notification).filter(
        (Notification.destinataire_type == "tous") |
        (Notification.destinataire_id == current_user.id)
    ).order_by(Notification.date_envoi.desc()).all()

@router.patch("/{nid}/read")
def mark_read(nid: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.id == nid).update({"lue": True})
    db.commit()
    return {"ok": True}
