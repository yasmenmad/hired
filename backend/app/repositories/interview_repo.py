from sqlalchemy.orm import Session
from app.models.models import SessionEntretien
from app.schemas.schemas import SessionCreate
import uuid
from datetime import datetime

class InterviewRepository:
    def __init__(self, db: Session): self.db = db
    def get_by_user(self, uid): return self.db.query(SessionEntretien).filter(SessionEntretien.utilisateur_id == uid).order_by(SessionEntretien.date_debut.desc()).all()
    def get_by_id(self, sid): return self.db.query(SessionEntretien).filter(SessionEntretien.id == sid).first()
    def create(self, uid, data: SessionCreate):
        s = SessionEntretien(id=str(uuid.uuid4()), utilisateur_id=uid, **data.model_dump(exclude_none=True), historique=[])
        self.db.add(s); self.db.commit(); self.db.refresh(s); return s
    def add_message(self, sid, role, content):
        s = self.get_by_id(sid)
        hist = list(s.historique or [])
        hist.append({"role": role, "content": content, "ts": datetime.utcnow().isoformat()})
        self.db.query(SessionEntretien).filter(SessionEntretien.id == sid).update({"historique": hist})
        self.db.commit()
    def end_session(self, sid, rapport):
        now = datetime.utcnow()
        s = self.get_by_id(sid)
        duree = int((now - s.date_debut).total_seconds())
        self.db.query(SessionEntretien).filter(SessionEntretien.id == sid).update({"statut":"terminee","date_fin":now,"duree_totale":duree,"rapport":rapport})
        self.db.commit(); return self.get_by_id(sid)
