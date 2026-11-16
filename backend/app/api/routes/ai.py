"""AI API routes — all Groq-powered features."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.infrastructure.ai.groq_service import (
    analyze_cv,
    generate_cover_letter,
    generate_interview_questions,
    score_interview_answer,
    analyze_salary,
    career_chat,
    score_job_match,
    summarize_job,
)

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Request models ─────────────────────────────────────────────

class CVAnalysisRequest(BaseModel):
    cv_text: str
    job_description: Optional[str] = ""


class CoverLetterRequest(BaseModel):
    user_profile: dict
    job: dict
    tone: Optional[str] = "professional"


class InterviewQuestionsRequest(BaseModel):
    role: str
    difficulty: Optional[str] = "standard"
    focus: Optional[list[str]] = ["Behavioral", "Technical"]


class AnswerScoreRequest(BaseModel):
    question: str
    answer: str
    role: str


class SalaryRequest(BaseModel):
    role: str
    location: str
    experience_years: int
    skills: list[str]


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    user_profile: Optional[dict] = {}


class MatchRequest(BaseModel):
    user_profile: dict
    job: dict


class CompanyDetailsRequest(BaseModel):
    company_name: str
    job_title: Optional[str] = ""


class InterviewSessionSaveRequest(BaseModel):
    role: str
    mode: str = "text"
    difficulty: str = "standard"
    questions: list[dict]
    answers: list[str]
    scores: Optional[list[dict]] = []
    overall_score: Optional[float] = None
    duration_seconds: Optional[int] = None


# ── Endpoints ──────────────────────────────────────────────────

@router.post("/cv/analyze")
async def analyze_cv_endpoint(req: CVAnalysisRequest):
    """Analyze a CV and return ATS score, issues, and improvements."""
    if len(req.cv_text.strip()) < 50:
        raise HTTPException(400, "CV text is too short. Please provide the full CV content.")
    try:
        result = await analyze_cv(req.cv_text, req.job_description or "")
        return result
    except ValueError as e:
        raise HTTPException(502, f"AI response parsing failed: {e}")
    except RuntimeError as e:
        raise HTTPException(503, f"AI service error: {e}")


@router.post("/cover-letter/generate")
async def generate_cover_letter_endpoint(req: CoverLetterRequest):
    """Generate a tailored cover letter for a specific job application."""
    if not req.job.get("title") or not req.job.get("company"):
        raise HTTPException(400, "Job must include at least title and company")
    try:
        letter = await generate_cover_letter(req.user_profile, req.job, req.tone or "professional")
        return {"cover_letter": letter}
    except RuntimeError as e:
        raise HTTPException(503, f"AI service error: {e}")


@router.post("/interview/questions")
async def get_interview_questions(req: InterviewQuestionsRequest):
    """Generate tailored interview questions for a role."""
    try:
        questions = await generate_interview_questions(req.role, req.difficulty, req.focus)
        return {"questions": questions, "count": len(questions)}
    except ValueError as e:
        raise HTTPException(502, f"AI response parsing failed: {e}")
    except RuntimeError as e:
        raise HTTPException(503, f"AI service error: {e}")


@router.post("/interview/score-answer")
async def score_answer(req: AnswerScoreRequest):
    """Score a single interview answer using STAR methodology."""
    if len(req.answer.strip()) < 10:
        raise HTTPException(400, "Answer is too short to score meaningfully")
    try:
        result = await score_interview_answer(req.question, req.answer, req.role)
        return result
    except ValueError as e:
        raise HTTPException(502, f"AI response parsing failed: {e}")
    except RuntimeError as e:
        raise HTTPException(503, f"AI service error: {e}")


@router.post("/salary/analyze")
async def get_salary_analysis(req: SalaryRequest):
    """Get salary benchmarks and negotiation intelligence for a role."""
    try:
        result = await analyze_salary(req.role, req.location, req.experience_years, req.skills)
        return result
    except ValueError as e:
        raise HTTPException(502, f"AI response parsing failed: {e}")
    except RuntimeError as e:
        raise HTTPException(503, f"AI service error: {e}")


@router.post("/chat")
async def career_chat_endpoint(req: ChatRequest):
    """Career coaching chat. Maintains conversation context."""
    if not req.messages:
        raise HTTPException(400, "At least one message is required")
    try:
        messages = [{"role": m.role, "content": m.content} for m in req.messages]
        reply = await career_chat(messages, req.user_profile or {})
        return {"reply": reply}
    except RuntimeError as e:
        raise HTTPException(503, f"AI service error: {e}")


@router.post("/match")
async def ai_match(req: MatchRequest):
    """Get an AI match score between a candidate profile and a job."""
    try:
        result = await score_job_match(req.user_profile, req.job)
        return result
    except ValueError as e:
        raise HTTPException(502, f"AI response parsing failed: {e}")
    except RuntimeError as e:
        raise HTTPException(503, f"AI service error: {e}")


@router.post("/company/details")
async def get_company_details(req: CompanyDetailsRequest):
    """Get AI-generated company details and insights."""
    from app.infrastructure.ai.groq_service import _json_chat
    prompt = f"""You are a business intelligence AI. Provide details about this company.

Company: {req.company_name}
Context job title: {req.job_title or "N/A"}

Return JSON:
{{
  "description": "<2-3 sentence company overview>",
  "industry": "<primary industry>",
  "size": "<startup|small|mid-size|large|enterprise>",
  "founded": "<year or 'Unknown'>",
  "headquarters": "<city, country or 'Unknown'>",
  "culture_tags": ["<3-4 culture descriptors>"],
  "known_for": ["<2-3 things the company is known for>"],
  "glassdoor_rating": <float 1-5 or null>,
  "logo_search_query": "<best Google image search query to find their logo>",
  "website": "<company website URL if well-known, else null>"
}}"""
    try:
        return await _json_chat([{"role": "user", "content": prompt}], temperature=0.3, max_tokens=600)
    except Exception:
        return {
            "description": f"{req.company_name} is a technology company.",
            "industry": "Technology",
            "size": "Unknown",
            "founded": "Unknown",
            "headquarters": "Unknown",
            "culture_tags": [],
            "known_for": [],
            "glassdoor_rating": None,
            "logo_search_query": req.company_name,
            "website": None,
        }


@router.post("/interview/save-session")
async def save_interview_session(req: InterviewSessionSaveRequest):
    """Save a completed interview session and return aggregated feedback."""
    from app.infrastructure.ai.groq_service import _json_chat
    import json

    qa_pairs = []
    for i, (q, a) in enumerate(zip(req.questions, req.answers)):
        score_data = req.scores[i] if i < len(req.scores or []) else {}
        qa_pairs.append({
            "question": q.get("question", q.get("q", "")),
            "answer": a,
            "score": score_data.get("overall_score", score_data.get("score", 0)),
        })

    overall = req.overall_score or (
        sum(p["score"] for p in qa_pairs) / max(len(qa_pairs), 1)
    )

    prompt = f"""You coached a {req.difficulty} interview for: {req.role}

Here are the Q&A results:
{json.dumps(qa_pairs[:5], indent=2)}

Return JSON with overall session feedback:
{{
  "overall_score": {round(overall)},
  "performance_label": "<Strong Hire|Hire|Maybe|No Hire>",
  "top_strength": "<their single biggest strength shown>",
  "top_improvement": "<single most important thing to improve>",
  "session_summary": "<2-3 sentence overall performance summary>",
  "next_steps": ["<2-3 actionable next steps to improve>"]
}}"""

    try:
        feedback = await _json_chat([{"role": "user", "content": prompt}], temperature=0.3, max_tokens=500)
        feedback["overall_score"] = round(overall)
        return feedback
    except Exception:
        return {
            "overall_score": round(overall),
            "performance_label": "Hire" if overall >= 70 else "Maybe",
            "top_strength": "Completed the interview session",
            "top_improvement": "Practice more specific examples with quantified outcomes",
            "session_summary": f"Completed {len(qa_pairs)} questions for {req.role} at {req.difficulty} difficulty.",
            "next_steps": ["Review STAR method", "Practice with more examples", "Research the company"],
        }
