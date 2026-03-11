from sqlalchemy.orm import Session
from app.models.models import Candidature
from app.schemas.schemas import CandidatureCreate
import uuid

class CandidatureRepository:
    def __init__(self, db: Session): self.db = db
    def get_by_user(self, uid): return self.db.query(Candidature).filter(Candidature.utilisateur_id == uid).order_by(Candidature.date_ajout.desc()).all()
    def get_by_id(self, cid): return self.db.query(Candidature).filter(Candidature.id == cid).first()
    def create(self, uid, data: CandidatureCreate):
        c = Candidature(id=str(uuid.uuid4()), utilisateur_id=uid, **data.model_dump(exclude_none=True))
        self.db.add(c); self.db.commit(); self.db.refresh(c); return c
    def update(self, cid, data: dict):
        self.db.query(Candidature).filter(Candidature.id == cid).update(data)
        self.db.commit(); return self.get_by_id(cid)
    def delete(self, cid): self.db.query(Candidature).filter(Candidature.id == cid).delete(); self.db.commit()
