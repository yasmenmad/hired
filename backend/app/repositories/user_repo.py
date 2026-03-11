from sqlalchemy.orm import Session
from app.models.models import Utilisateur, Profil
from app.schemas.schemas import RegisterRequest
from app.core.security import hash_password, verify_password
from datetime import datetime

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str):
        return self.db.query(Utilisateur).filter(Utilisateur.id == user_id).first()

    def get_by_email(self, email: str):
        return self.db.query(Utilisateur).filter(Utilisateur.email == email).first()

    def get_all(self, skip=0, limit=100):
        return self.db.query(Utilisateur).offset(skip).limit(limit).all()

    def create(self, data: RegisterRequest) -> Utilisateur:
        user = Utilisateur(
            nom=data.nom,
            prenom=data.prenom,
            email=data.email,
            mot_de_passe=hash_password(data.mot_de_passe),
        )
        self.db.add(user)
        self.db.flush()
        # Create empty profil
        profil = Profil(utilisateur_id=user.id)
        self.db.add(profil)
        self.db.commit()
        self.db.refresh(user)
        return user

    def verify_password(self, plain: str, hashed: str) -> bool:
        return verify_password(plain, hashed)

    def update_last_login(self, user_id: str):
        self.db.query(Utilisateur).filter(Utilisateur.id == user_id).update(
            {"derniere_connexion": datetime.utcnow()}
        )
        self.db.commit()

    def update(self, user_id: str, data: dict):
        self.db.query(Utilisateur).filter(Utilisateur.id == user_id).update(data)
        self.db.commit()
        return self.get_by_id(user_id)

    def ban(self, user_id: str):
        self.update(user_id, {"statut": "banni"})

    def unban(self, user_id: str):
        self.update(user_id, {"statut": "actif"})

    def get_profil(self, user_id: str):
        return self.db.query(Profil).filter(Profil.utilisateur_id == user_id).first()

    def update_profil(self, user_id: str, data: dict):
        profil = self.get_profil(user_id)
        if profil:
            for k, v in data.items():
                if v is not None:
                    setattr(profil, k, v)
            self.db.commit()
            self.db.refresh(profil)
        return profil

    def count(self):
        return self.db.query(Utilisateur).count()

    def count_active(self):
        return self.db.query(Utilisateur).filter(Utilisateur.statut == "actif").count()
