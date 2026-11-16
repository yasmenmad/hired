"""Admin routes — platform stats and management."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.core.database import get_db, UserModel, JobModel, ApplicationModel, InterviewSessionModel
from app.api.routes.auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def platform_stats(
    user=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Real platform statistics for the admin dashboard."""
    # User counts
    total_users = (await db.execute(select(func.count(UserModel.id)))).scalar()
    pro_users   = (await db.execute(select(func.count(UserModel.id)).where(UserModel.plan == "pro"))).scalar()

    # Job counts
    total_jobs = (await db.execute(select(func.count(JobModel.id)))).scalar()

    # Application counts
    total_apps = (await db.execute(select(func.count(ApplicationModel.id)))).scalar()
    offers     = (await db.execute(select(func.count(ApplicationModel.id)).where(ApplicationModel.status == "offer"))).scalar()

    # Recent signups (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users = (await db.execute(
        select(func.count(UserModel.id)).where(UserModel.created_at >= week_ago)
    )).scalar()

    return {
        "users": {
            "total": total_users,
            "pro": pro_users,
            "new_this_week": new_users,
        },
        "jobs": {
            "total": total_jobs,
            "active": total_jobs,
        },
        "applications": {
            "total": total_apps,
            "offers": offers,
            "offer_rate": round(offers / max(total_apps, 1) * 100, 1),
        },
    }


@router.get("/users")
async def list_users(
    page: int = 1,
    page_size: int = 50,
    user=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users (admin only)."""
    offset = (page - 1) * page_size
    result = await db.execute(
        select(UserModel).order_by(UserModel.created_at.desc()).offset(offset).limit(page_size)
    )
    users = result.scalars().all()
    total = (await db.execute(select(func.count(UserModel.id)))).scalar()
    return {
        "users": [{"id": u.id, "email": u.email, "name": u.name, "plan": u.plan,
                   "is_admin": u.is_admin, "created_at": u.created_at.isoformat() if u.created_at else None}
                  for u in users],
        "total": total,
        "page": page,
    }
