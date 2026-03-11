from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.jobs_service import JobsService
from app.services.ai_service import AIService
from app.repositories.user_repo import UserRepository
from app.schemas.schemas import CompatibilityRequest

router = APIRouter()

@router.get("/search")
async def search_jobs(
    query: str = Query(...),
    location: str = Query(None),
    type_contrat: str = Query(None),
    page: int = Query(1),
    current_user=Depends(get_current_user)
):
    service = JobsService()
    return await service.search(query, location, type_contrat, page)

@router.post("/compatibility")
async def get_compatibility(
    data: CompatibilityRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profil = UserRepository(db).get_profil(current_user.id)
    ai = AIService()
    return await ai.calculate_compatibility(
        {"competences": profil.competences, "niveau_exp": profil.niveau_exp, "domaines": profil.domaines_activite},
        {"offre_id": data.offre_id}
    )
