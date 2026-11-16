"""
Hired. Backend API
==================
FastAPI + Groq AI + Multi-source job scraping

Run:
    uvicorn app.main:app --reload --port 8000

Docs:
    http://localhost:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import init_db
from app.api.routes import jobs, ai, auth, applications, admin

# ── Logging ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger(__name__)
settings = get_settings()


# ── Lifespan ───────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB. Shutdown: cleanup."""
    log.info("🚀 Hired. API starting up...")
    await init_db()
    log.info("✅ Database initialized")
    log.info(f"🤖 Groq model: {settings.groq_model}")
    log.info(f"🌍 Environment: {settings.environment}")
    yield
    log.info("👋 Hired. API shutting down")


# ── App ────────────────────────────────────────────────────────
app = FastAPI(
    title="Hired. API",
    description="""
## Hired. — AI-Powered Job Platform API

### Features
- 🔍 **Live job search** across LinkedIn, Indeed, RemoteOK, We Work Remotely, Greenhouse, Arbeitnow
- 🤖 **AI match scoring** — Groq LLaMA 3.3 70B rates your fit for each job
- 📄 **CV analysis** — ATS score, issues, and rewrite suggestions  
- ✍️ **Cover letter generation** — tailored to each job in seconds
- 🎤 **Interview coaching** — AI-generated questions + answer scoring
- 💰 **Salary intelligence** — benchmarks + negotiation scripts
- 💬 **Career coaching chat** — conversational AI career advisor

### Auth
Use `/auth/register` or `/auth/login` to get a JWT token.
Include it as: `Authorization: Bearer <token>`

### Admin Login
Email: `admin@hired.ai` | Password: `admin123`
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api/v1")
app.include_router(jobs.router,         prefix="/api/v1")
app.include_router(ai.router,           prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(admin.router,        prefix="/api/v1")


# ── Root ───────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "Hired. API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "auth":         "/api/v1/auth",
            "jobs":         "/api/v1/jobs",
            "ai":           "/api/v1/ai",
            "applications": "/api/v1/applications",
            "admin":        "/api/v1/admin",
        },
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "groq_configured": bool(settings.groq_api_key)}


# ── Global error handler ───────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    log.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )
