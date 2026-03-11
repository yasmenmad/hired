from sqlalchemy.orm import Session
from app.models.models import CV
import uuid
from datetime import datetime

class CVRepository:
    def __init__(self, db: Session): self.db = db
    def get_by_user(self, uid): return self.db.query(CV).filter(CV.utilisateur_id == uid).order_by(CV.date_creation.desc()).all()
    def get_by_id(self, cid): return self.db.query(CV).filter(CV.id == cid).first()
    def create_upload(self, uid, filename, content):
        cv = CV(id=str(uuid.uuid4()), utilisateur_id=uid, titre=filename, type_cv="upload", contenu_structure=content)
        self.db.add(cv); self.db.commit(); self.db.refresh(cv); return cv
    def create_generated(self, uid, content):
        cv = CV(id=str(uuid.uuid4()), utilisateur_id=uid, titre=content.get("titre_pro","Mon CV"), type_cv="genere", contenu_structure=content, score_ats=content.get("score_ats"))
        self.db.add(cv); self.db.commit(); self.db.refresh(cv); return cv
    def delete(self, cid): self.db.query(CV).filter(CV.id == cid).delete(); self.db.commit()
