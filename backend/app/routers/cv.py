from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.repositories.cv_repo import CVRepository
from app.services.ai_service import AIService
from app.schemas.schemas import CVGenerateRequest, CVOptimizeRequest, CVResponse
from typing import List
import io

router = APIRouter()

@router.get("/", response_model=List[CVResponse])
def get_my_cvs(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return CVRepository(db).get_by_user(current_user.id)

@router.post("/upload", response_model=CVResponse, status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(400, "Format accepté : PDF ou DOCX")
    content = await file.read()
    ai = AIService()
    extracted = await ai.extract_cv_text(content, file.content_type)
    cv = CVRepository(db).create_upload(current_user.id, file.filename, extracted)
    return cv

@router.post("/generate", response_model=CVResponse, status_code=201)
async def generate_cv(
    data: CVGenerateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ai = AIService()
    generated = await ai.generate_cv(data.questionnaire)
    cv = CVRepository(db).create_generated(current_user.id, generated)
    return cv

@router.post("/optimize/stream")
async def optimize_cv_stream(
    data: CVOptimizeRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ai = AIService()
    async def event_stream():
        async for chunk in ai.optimize_cv_stream(data.cv_content, data.job_description):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/{cv_id}", response_model=CVResponse)
def get_cv(cv_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    cv = CVRepository(db).get_by_id(cv_id)
    if not cv or cv.utilisateur_id != current_user.id:
        raise HTTPException(404, "CV introuvable")
    return cv

@router.delete("/{cv_id}", status_code=204)
def delete_cv(cv_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    repo = CVRepository(db)
    cv = repo.get_by_id(cv_id)
    if not cv or cv.utilisateur_id != current_user.id:
        raise HTTPException(404, "CV introuvable")
    repo.delete(cv_id)
