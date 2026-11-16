"""Jobs API routes — search, filter, scrape, match scoring."""

from collections import Counter
from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import logging

from app.core.database import get_db, AsyncSessionLocal, JobModel
from app.infrastructure.scrapers.job_scraper import scrape_all_jobs
from app.infrastructure.ai.groq_service import score_job_match, summarize_job
from app.core.config import get_settings

log = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["Jobs"])
settings = get_settings()

_job_cache: list[dict] = []
_last_scrape: datetime | None = None


async def _ensure_fresh_jobs(db: AsyncSession, background_tasks: BackgroundTasks):
    global _job_cache, _last_scrape
    now = datetime.utcnow()
    if _last_scrape is None or (now - _last_scrape).total_seconds() > settings.scrape_interval:
        background_tasks.add_task(_do_scrape_and_save)
    if not _job_cache:
        result = await db.execute(select(JobModel).order_by(JobModel.posted_at.desc()).limit(500))
        _job_cache = [_model_to_dict(r) for r in result.scalars().all()]
    return _job_cache


async def _do_scrape_and_save():
    """Background task with its own DB session (never uses request session)."""
    global _job_cache, _last_scrape
    try:
        log.info("Starting background job scrape...")
        jobs = await scrape_all_jobs()
        _last_scrape = datetime.utcnow()
        async with AsyncSessionLocal() as db:
            for job in jobs[:settings.max_jobs_per_source * 6]:
                existing = await db.get(JobModel, job["id"])
                if existing is None:
                    db.add(JobModel(
                        id=job["id"], title=job["title"], company=job["company"],
                        location=job["location"], salary=job.get("salary", ""),
                        job_type=job.get("job_type", "Full-time"), level=job.get("level", "Mid"),
                        description=job.get("description", ""), skills=job.get("skills", []),
                        apply_url=job.get("apply_url", ""), source=job.get("source", ""),
                        logo_url=job.get("logo_url", ""), remote=job.get("remote", False),
                        posted_at=job.get("posted_at", datetime.utcnow()),
                    ))
                elif not existing.logo_url and job.get("logo_url"):
                    existing.logo_url = job["logo_url"]
            await db.commit()
        _job_cache = jobs
        log.info(f"Job scrape complete: {len(jobs)} jobs saved")
    except Exception as e:
        log.error(f"Background scrape failed: {e}", exc_info=True)


def _model_to_dict(m: JobModel) -> dict:
    return {
        "id": m.id, "title": m.title, "company": m.company, "location": m.location,
        "salary": m.salary, "job_type": m.job_type, "level": m.level,
        "description": m.description, "skills": m.skills or [],
        "apply_url": m.apply_url, "source": m.source, "logo_url": m.logo_url,
        "remote": m.remote, "featured": m.featured,
        "posted_at": m.posted_at.isoformat() if m.posted_at else None,
        "views": m.views, "applications": m.applications,
    }


# ── Static routes MUST be BEFORE /{job_id} ────────────────────────────────

@router.get("")
async def list_jobs(
    background_tasks: BackgroundTasks,
    q: str = Query(""), location: str = Query(""), job_type: str = Query(""),
    level: str = Query(""), remote: bool = Query(None), source: str = Query(""),
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    jobs = await _ensure_fresh_jobs(db, background_tasks)
    filtered = jobs
    if q:
        ql = q.lower()
        filtered = [j for j in filtered if
            ql in (j.get("title") or "").lower() or ql in (j.get("company") or "").lower() or
            ql in (j.get("location") or "").lower() or
            any(ql in s.lower() for s in (j.get("skills") or []))]
    if location:
        ll = location.lower()
        filtered = [j for j in filtered if ll in (j.get("location") or "").lower()]
    if job_type:
        filtered = [j for j in filtered if j.get("job_type") == job_type]
    if level:
        filtered = [j for j in filtered if j.get("level") == level]
    if remote is not None:
        filtered = [j for j in filtered if j.get("remote") == remote]
    if source:
        filtered = [j for j in filtered if (j.get("source") or "").lower() == source.lower()]
    total = len(filtered)
    start = (page - 1) * page_size
    return {"total": total, "page": page, "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size),
            "jobs": filtered[start: start + page_size]}


@router.get("/sources")
async def get_sources():
    counts = Counter(j.get("source", "unknown") for j in _job_cache)
    return {
        "sources": [{"name": k, "count": v} for k, v in counts.most_common()],
        "total": len(_job_cache),
        "last_updated": _last_scrape.isoformat() if _last_scrape else None,
    }


@router.post("/scrape/trigger")
async def trigger_scrape(background_tasks: BackgroundTasks):
    background_tasks.add_task(_do_scrape_and_save)
    return {"message": "Scrape triggered in background", "status": "running"}


# ── /{job_id} routes last ─────────────────────────────────────────────────

@router.get("/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(JobModel, job_id)
    if not job:
        cached = next((j for j in _job_cache if j["id"] == job_id), None)
        if not cached:
            raise HTTPException(404, "Job not found")
        return cached
    job.views = (job.views or 0) + 1
    await db.commit()
    return _model_to_dict(job)


@router.post("/{job_id}/summarize")
async def summarize(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(JobModel, job_id)
    if not job:
        cached = next((j for j in _job_cache if j["id"] == job_id), None)
        if not cached:
            raise HTTPException(404, "Job not found")
        desc, title = cached.get("description", ""), cached.get("title", "")
    else:
        desc, title = job.description or "", job.title or ""
    if not desc:
        raise HTTPException(400, "No job description available to summarize")
    return await summarize_job(desc, title)


@router.post("/{job_id}/match")
async def match_score(job_id: str, user_profile: dict, db: AsyncSession = Depends(get_db)):
    job = await db.get(JobModel, job_id)
    if not job:
        cached = next((j for j in _job_cache if j["id"] == job_id), None)
        if not cached:
            raise HTTPException(404, "Job not found")
        job_dict = cached
    else:
        job_dict = _model_to_dict(job)
    return await score_job_match(user_profile, job_dict)
