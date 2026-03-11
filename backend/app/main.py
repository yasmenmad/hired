from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, cv, jobs, candidatures, interview, notifications, admin
from app.core.config import settings

app = FastAPI(
    title="Hired API",
    description="Plateforme intelligente de recherche d'emploi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,           prefix="/api/auth",           tags=["Auth"])
app.include_router(users.router,          prefix="/api/users",          tags=["Users"])
app.include_router(cv.router,             prefix="/api/cv",             tags=["CV"])
app.include_router(jobs.router,           prefix="/api/jobs",           tags=["Jobs"])
app.include_router(candidatures.router,   prefix="/api/candidatures",   tags=["Candidatures"])
app.include_router(interview.router,      prefix="/api/interview",      tags=["Interview"])
app.include_router(notifications.router,  prefix="/api/notifications",  tags=["Notifications"])
app.include_router(admin.router,          prefix="/api/admin",          tags=["Admin"])

@app.get("/")
def root():
    return {"message": "Hired API is running 🚀", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
