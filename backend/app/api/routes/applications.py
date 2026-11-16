"""Applications routes — track job applications through the pipeline."""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, ApplicationModel, JobModel
from app.api.routes.auth import get_current_user, UserModel

router = APIRouter(prefix="/applications", tags=["Applications"])

VALID_STATUSES = {"saved", "applied", "interview", "offer", "rejected"}


class CreateApplicationRequest(BaseModel):
    job_id: str
    status: Optional[str] = "applied"
    cover_letter: Optional[str] = ""
    notes: Optional[str] = ""
    match_score: Optional[float] = None


class UpdateApplicationRequest(BaseModel):
    status: Optional[str] = None
    cover_letter: Optional[str] = None
    notes: Optional[str] = None


def _app_to_dict(a: ApplicationModel, job: JobModel = None) -> dict:
    job_info = None
    if job:
        job_info = {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "salary": job.salary,
            "apply_url": job.apply_url,
            "logo_url": job.logo_url,
            "source": job.source,
        }
    return {
        "id": a.id,
        "user_id": a.user_id,
        "job_id": a.job_id,
        "status": a.status,
        "cover_letter": a.cover_letter,
        "notes": a.notes,
        "match_score": a.match_score,
        "applied_at": a.applied_at.isoformat() if a.applied_at else None,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        "job": job_info,
    }


@router.get("")
async def list_applications(
    user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all applications for the current user, with job details embedded."""
    result = await db.execute(
        select(ApplicationModel)
        .where(ApplicationModel.user_id == user.id)
        .order_by(ApplicationModel.applied_at.desc())
    )
    apps = result.scalars().all()

    # Fetch job details for each application
    output = []
    for app in apps:
        job = await db.get(JobModel, app.job_id)
        output.append(_app_to_dict(app, job))
    return output


@router.get("/stats")
async def application_stats(
    user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get application pipeline stats for the kanban board."""
    result = await db.execute(
        select(ApplicationModel).where(ApplicationModel.user_id == user.id)
    )
    apps = result.scalars().all()

    stats = {s: 0 for s in VALID_STATUSES}
    for a in apps:
        stats[a.status] = stats.get(a.status, 0) + 1

    return {
        "total": len(apps),
        "by_status": stats,
        "offer_rate": round(stats["offer"] / max(len(apps), 1) * 100, 1),
        "interview_rate": round(stats["interview"] / max(len(apps), 1) * 100, 1),
    }


@router.post("", status_code=201)
async def create_application(
    req: CreateApplicationRequest,
    user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply to a job or save it. Upserts if already exists."""
    if req.status not in VALID_STATUSES:
        raise HTTPException(400, f"Status must be one of: {', '.join(VALID_STATUSES)}")

    existing_result = await db.execute(
        select(ApplicationModel).where(
            ApplicationModel.user_id == user.id,
            ApplicationModel.job_id == req.job_id,
        )
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        existing.status = req.status
        if req.cover_letter:
            existing.cover_letter = req.cover_letter
        if req.notes:
            existing.notes = req.notes
        if req.match_score is not None:
            existing.match_score = req.match_score
        existing.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        job = await db.get(JobModel, existing.job_id)
        return _app_to_dict(existing, job)

    app = ApplicationModel(
        id=str(uuid.uuid4()),
        user_id=user.id,
        job_id=req.job_id,
        status=req.status,
        cover_letter=req.cover_letter or "",
        notes=req.notes or "",
        match_score=req.match_score,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    job = await db.get(JobModel, app.job_id)
    return _app_to_dict(app, job)


@router.patch("/{app_id}")
async def update_application(
    app_id: str,
    req: UpdateApplicationRequest,
    user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an application status, notes, or cover letter."""
    app = await db.get(ApplicationModel, app_id)
    if not app or app.user_id != user.id:
        raise HTTPException(404, "Application not found")

    if req.status is not None:
        if req.status not in VALID_STATUSES:
            raise HTTPException(400, f"Status must be one of: {', '.join(VALID_STATUSES)}")
        app.status = req.status
    if req.cover_letter is not None:
        app.cover_letter = req.cover_letter
    if req.notes is not None:
        app.notes = req.notes

    app.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(app)
    job = await db.get(JobModel, app.job_id)
    return _app_to_dict(app, job)


@router.delete("/{app_id}", status_code=204)
async def delete_application(
    app_id: str,
    user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove an application."""
    app = await db.get(ApplicationModel, app_id)
    if not app or app.user_id != user.id:
        raise HTTPException(404, "Application not found")
    await db.delete(app)
    await db.commit()
