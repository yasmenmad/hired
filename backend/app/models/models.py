import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Integer, Text, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    nom              = Column(String(100), nullable=False)
    prenom           = Column(String(100), nullable=False)
    email            = Column(String(255), unique=True, nullable=False, index=True)
    mot_de_passe     = Column(String(255), nullable=False)
    photo_profil     = Column(String(500), nullable=True)
    role             = Column(Enum("user", "admin", name="role_enum"), default="user")
    statut           = Column(Enum("actif", "banni", name="statut_enum"), default="actif")
    date_inscription = Column(DateTime, default=datetime.utcnow)
    derniere_connexion = Column(DateTime, nullable=True)

    profil           = relationship("Profil", back_populates="utilisateur", uselist=False, cascade="all, delete")
    cvs              = relationship("CV", back_populates="utilisateur", cascade="all, delete")
    candidatures     = relationship("Candidature", back_populates="utilisateur", cascade="all, delete")
    sessions         = relationship("SessionEntretien", back_populates="utilisateur", cascade="all, delete")
    test_preferences = relationship("TestPreferences", back_populates="utilisateur", uselist=False, cascade="all, delete")


class Profil(Base):
    __tablename__ = "profils"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    utilisateur_id   = Column(UUID(as_uuid=False), ForeignKey("utilisateurs.id"), unique=True, nullable=False)
    titre_pro        = Column(String(200), nullable=True)
    resume           = Column(Text, nullable=True)
    localisation     = Column(String(200), nullable=True)
    niveau_exp       = Column(Enum("junior", "intermediaire", "senior", name="niveau_enum"), nullable=True)
    competences      = Column(JSONB, default=list)
    domaines_activite = Column(JSONB, default=list)
    preferences      = Column(JSONB, default=dict)

    utilisateur      = relationship("Utilisateur", back_populates="profil")


class CV(Base):
    __tablename__ = "cvs"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    utilisateur_id   = Column(UUID(as_uuid=False), ForeignKey("utilisateurs.id"), nullable=False)
    titre            = Column(String(200), nullable=False)
    type_cv          = Column(Enum("upload", "genere", name="type_cv_enum"), nullable=False)
    contenu_structure = Column(JSONB, nullable=True)
    fichier_original = Column(String(500), nullable=True)
    score_ats        = Column(Float, nullable=True)
    date_creation    = Column(DateTime, default=datetime.utcnow)
    date_modif       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    utilisateur      = relationship("Utilisateur", back_populates="cvs")


class OffreEmploi(Base):
    __tablename__ = "offres_emploi"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    titre_poste      = Column(String(300), nullable=False)
    entreprise       = Column(String(300), nullable=False)
    localisation     = Column(String(300), nullable=True)
    description      = Column(Text, nullable=True)
    competences_requises = Column(JSONB, default=list)
    type_contrat     = Column(String(50), nullable=True)
    niveau_exp       = Column(String(100), nullable=True)
    url_offre        = Column(String(1000), nullable=True)
    date_publication = Column(DateTime, nullable=True)
    source           = Column(String(100), nullable=True)

    candidatures     = relationship("Candidature", back_populates="offre")
    sessions         = relationship("SessionEntretien", back_populates="offre")


class Candidature(Base):
    __tablename__ = "candidatures"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    utilisateur_id   = Column(UUID(as_uuid=False), ForeignKey("utilisateurs.id"), nullable=False)
    offre_id         = Column(UUID(as_uuid=False), ForeignKey("offres_emploi.id"), nullable=True)
    entreprise_manuelle = Column(String(300), nullable=True)
    poste_manuel     = Column(String(300), nullable=True)
    statut           = Column(
        Enum("sauvegardee", "envoyee", "entretien", "offre_recue", "refusee", name="statut_cand_enum"),
        default="sauvegardee"
    )
    priorite         = Column(
        Enum("faible", "moyen", "eleve", "critique", name="priorite_enum"),
        default="moyen"
    )
    score_compatibilite = Column(Float, nullable=True)
    notes            = Column(Text, nullable=True)
    contact          = Column(String(200), nullable=True)
    date_ajout       = Column(DateTime, default=datetime.utcnow)
    date_candidature = Column(DateTime, nullable=True)

    utilisateur      = relationship("Utilisateur", back_populates="candidatures")
    offre            = relationship("OffreEmploi", back_populates="candidatures")


class SessionEntretien(Base):
    __tablename__ = "sessions_entretien"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    utilisateur_id   = Column(UUID(as_uuid=False), ForeignKey("utilisateurs.id"), nullable=False)
    offre_id         = Column(UUID(as_uuid=False), ForeignKey("offres_emploi.id"), nullable=True)
    description_manuelle = Column(Text, nullable=True)
    niveau_expertise = Column(Enum("junior", "intermediaire", "senior", name="niveau_session_enum"), nullable=False)
    mode             = Column(Enum("texte", "audio", name="mode_enum"), default="texte")
    statut           = Column(Enum("en_cours", "pause", "terminee", name="statut_session_enum"), default="en_cours")
    historique       = Column(JSONB, default=list)
    rapport          = Column(JSONB, nullable=True)
    date_debut       = Column(DateTime, default=datetime.utcnow)
    date_fin         = Column(DateTime, nullable=True)
    duree_totale     = Column(Integer, nullable=True)

    utilisateur      = relationship("Utilisateur", back_populates="sessions")
    offre            = relationship("OffreEmploi", back_populates="sessions")


class Notification(Base):
    __tablename__ = "notifications"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    titre            = Column(String(300), nullable=False)
    contenu          = Column(Text, nullable=False)
    destinataire_type = Column(Enum("tous", "specifique", name="dest_enum"), default="tous")
    destinataire_id  = Column(UUID(as_uuid=False), nullable=True)
    lue              = Column(Boolean, default=False)
    date_envoi       = Column(DateTime, default=datetime.utcnow)


class TestPreferences(Base):
    __tablename__ = "test_preferences"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    utilisateur_id   = Column(UUID(as_uuid=False), ForeignKey("utilisateurs.id"), unique=True, nullable=False)
    reponses         = Column(JSONB, default=dict)
    date_completion  = Column(DateTime, default=datetime.utcnow)

    utilisateur      = relationship("Utilisateur", back_populates="test_preferences")
