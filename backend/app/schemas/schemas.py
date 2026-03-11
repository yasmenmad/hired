from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

# ─── ENUMS ───────────────────────────────────────────
class RoleEnum(str, Enum):
    user = "user"
    admin = "admin"

class StatutEnum(str, Enum):
    actif = "actif"
    banni = "banni"

class NiveauEnum(str, Enum):
    junior = "junior"
    intermediaire = "intermediaire"
    senior = "senior"

class StatutCandEnum(str, Enum):
    sauvegardee = "sauvegardee"
    envoyee = "envoyee"
    entretien = "entretien"
    offre_recue = "offre_recue"
    refusee = "refusee"

class PrioriteEnum(str, Enum):
    faible = "faible"
    moyen = "moyen"
    eleve = "eleve"
    critique = "critique"

class ModeEnum(str, Enum):
    texte = "texte"
    audio = "audio"

# ─── AUTH ────────────────────────────────────────────
class RegisterRequest(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    mot_de_passe: str

class LoginRequest(BaseModel):
    email: EmailStr
    mot_de_passe: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

# ─── USER ─────────────────────────────────────────────
class UserResponse(BaseModel):
    id: str
    nom: str
    prenom: str
    email: str
    photo_profil: Optional[str]
    role: str
    statut: str
    date_inscription: datetime
    class Config: from_attributes = True

class UserUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    photo_profil: Optional[str] = None

# ─── PROFIL ───────────────────────────────────────────
class ProfilUpdate(BaseModel):
    titre_pro: Optional[str] = None
    resume: Optional[str] = None
    localisation: Optional[str] = None
    niveau_exp: Optional[NiveauEnum] = None
    competences: Optional[List[str]] = None
    domaines_activite: Optional[List[str]] = None
    preferences: Optional[dict] = None

class ProfilResponse(BaseModel):
    id: str
    titre_pro: Optional[str]
    resume: Optional[str]
    localisation: Optional[str]
    niveau_exp: Optional[str]
    competences: Optional[List[str]]
    domaines_activite: Optional[List[str]]
    preferences: Optional[dict]
    class Config: from_attributes = True

# ─── CV ───────────────────────────────────────────────
class CVGenerateRequest(BaseModel):
    questionnaire: dict

class CVOptimizeRequest(BaseModel):
    cv_content: str
    job_description: Optional[str] = None

class CVResponse(BaseModel):
    id: str
    titre: str
    type_cv: str
    contenu_structure: Optional[dict]
    score_ats: Optional[float]
    date_creation: datetime
    date_modif: datetime
    class Config: from_attributes = True

# ─── OFFRE ────────────────────────────────────────────
class JobSearchRequest(BaseModel):
    query: str
    location: Optional[str] = None
    type_contrat: Optional[str] = None
    page: int = 1

class CompatibilityRequest(BaseModel):
    offre_id: str
    cv_id: Optional[str] = None

class OffreResponse(BaseModel):
    id: str
    titre_poste: str
    entreprise: str
    localisation: Optional[str]
    description: Optional[str]
    competences_requises: Optional[List[str]]
    type_contrat: Optional[str]
    niveau_exp: Optional[str]
    url_offre: Optional[str]
    date_publication: Optional[datetime]
    class Config: from_attributes = True

# ─── CANDIDATURE ──────────────────────────────────────
class CandidatureCreate(BaseModel):
    offre_id: Optional[str] = None
    entreprise_manuelle: Optional[str] = None
    poste_manuel: Optional[str] = None
    statut: StatutCandEnum = StatutCandEnum.sauvegardee
    priorite: PrioriteEnum = PrioriteEnum.moyen
    notes: Optional[str] = None
    contact: Optional[str] = None
    date_candidature: Optional[datetime] = None

class CandidatureUpdate(BaseModel):
    statut: Optional[StatutCandEnum] = None
    priorite: Optional[PrioriteEnum] = None
    notes: Optional[str] = None
    contact: Optional[str] = None
    date_candidature: Optional[datetime] = None

class CandidatureResponse(BaseModel):
    id: str
    offre_id: Optional[str]
    entreprise_manuelle: Optional[str]
    poste_manuel: Optional[str]
    statut: str
    priorite: str
    score_compatibilite: Optional[float]
    notes: Optional[str]
    contact: Optional[str]
    date_ajout: datetime
    date_candidature: Optional[datetime]
    class Config: from_attributes = True

# ─── SESSION ENTRETIEN ────────────────────────────────
class SessionCreate(BaseModel):
    offre_id: Optional[str] = None
    description_manuelle: Optional[str] = None
    niveau_expertise: NiveauEnum
    mode: ModeEnum = ModeEnum.texte

class MessageRequest(BaseModel):
    message: str

class SessionResponse(BaseModel):
    id: str
    offre_id: Optional[str]
    niveau_expertise: str
    mode: str
    statut: str
    historique: Optional[List[Any]]
    rapport: Optional[dict]
    date_debut: datetime
    date_fin: Optional[datetime]
    class Config: from_attributes = True

# ─── NOTIFICATION ─────────────────────────────────────
class NotificationCreate(BaseModel):
    titre: str
    contenu: str
    destinataire_type: str = "tous"
    destinataire_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    titre: str
    contenu: str
    destinataire_type: str
    lue: bool
    date_envoi: datetime
    class Config: from_attributes = True
