from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.repositories.interview_repo import InterviewRepository
from app.services.ai_service import AIService
from app.schemas.schemas import SessionCreate, MessageRequest, SessionResponse
from typing import List
from datetime import datetime

router = APIRouter()

@router.post("/start", response_model=SessionResponse, status_code=201)
async def start_session(
    data: SessionCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = InterviewRepository(db)
    session = repo.create(current_user.id, data)
    # Generate first question via AI
    ai = AIService()
    context = data.description_manuelle or "Entretien général"
    first_q = await ai.generate_interview_question(context, data.niveau_expertise, [])
    repo.add_message(session.id, "assistant", first_q)
    session = repo.get_by_id(session.id)
    return session

@router.post("/{session_id}/message/stream")
async def send_message_stream(
    session_id: str,
    data: MessageRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = InterviewRepository(db)
    session = repo.get_by_id(session_id)
    if not session or session.utilisateur_id != current_user.id:
        raise HTTPException(404, "Session introuvable")
    if session.statut == "terminee":
        raise HTTPException(400, "Session terminée")

    repo.add_message(session_id, "user", data.message)
    ai = AIService()

    async def stream():
        full_response = ""
        async for chunk in ai.interview_response_stream(
            session.historique,
            data.message,
            session.niveau_expertise
        ):
            full_response += chunk
            yield f"data: {chunk}\n\n"
        repo.add_message(session_id, "assistant", full_response)
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")

@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = InterviewRepository(db)
    session = repo.get_by_id(session_id)
    if not session or session.utilisateur_id != current_user.id:
        raise HTTPException(404, "Session introuvable")
    ai = AIService()
    rapport = await ai.generate_star_report(session.historique)
    updated = repo.end_session(session_id, rapport)
    return updated

@router.get("/", response_model=List[SessionResponse])
def get_my_sessions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return InterviewRepository(db).get_by_user(current_user.id)

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = InterviewRepository(db).get_by_id(session_id)
    if not session or session.utilisateur_id != current_user.id:
        raise HTTPException(404, "Session introuvable")
    return session
