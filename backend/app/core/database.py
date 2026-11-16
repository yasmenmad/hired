from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, JSON
from datetime import datetime
from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# ── ORM Models ─────────────────────────────────────────────────

class JobModel(Base):
    __tablename__ = "jobs"
    id            = Column(String, primary_key=True)
    title         = Column(String, nullable=False)
    company       = Column(String, nullable=False)
    location      = Column(String)
    salary        = Column(String)
    job_type      = Column(String)
    level         = Column(String)
    description   = Column(Text)
    skills        = Column(JSON)        # list[str]
    apply_url     = Column(String)
    source        = Column(String)      # linkedin | indeed | weworkremotely | remoteok | greenhouse
    logo_url      = Column(String)
    remote        = Column(Boolean, default=False)
    featured      = Column(Boolean, default=False)
    posted_at     = Column(DateTime, default=datetime.utcnow)
    scraped_at    = Column(DateTime, default=datetime.utcnow)
    views         = Column(Integer, default=0)
    applications  = Column(Integer, default=0)


class UserModel(Base):
    __tablename__ = "users"
    id            = Column(String, primary_key=True)
    email         = Column(String, unique=True, nullable=False)
    hashed_pw     = Column(String, nullable=False)
    name          = Column(String)
    title         = Column(String)
    location      = Column(String)
    skills        = Column(JSON)
    bio           = Column(Text)
    plan          = Column(String, default="free")   # free | pro | business
    is_admin      = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)


class ApplicationModel(Base):
    __tablename__ = "applications"
    id            = Column(String, primary_key=True)
    user_id       = Column(String, nullable=False)
    job_id        = Column(String, nullable=False)
    status        = Column(String, default="applied")  # saved|applied|interview|offer|rejected
    cover_letter  = Column(Text)
    notes         = Column(Text)
    match_score   = Column(Float)
    applied_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InterviewSessionModel(Base):
    __tablename__ = "interview_sessions"
    id            = Column(String, primary_key=True)
    user_id       = Column(String, nullable=False)
    role          = Column(String)
    mode          = Column(String)          # text | voice | video
    difficulty    = Column(String)
    score         = Column(Float)
    answers       = Column(JSON)
    feedback      = Column(JSON)
    completed     = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)


# ── DB init ────────────────────────────────────────────────────

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
