"""
EduPulse AI — FastAPI Application Entry Point
"""
import sys
from pathlib import Path

# Ensure backend directory is in sys.path so 'import app' works regardless of where uvicorn is launched
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, students, professors, admin, attendance, marks, notifications, courses

# Import models so SQLAlchemy registers them
import app.models  # noqa

settings = get_settings()

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduPulse",
    description="Intelligent Student Academic Monitoring and Support System — KPRIET",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
allowed_origins = [
    origin.strip()
    for origin in settings.FRONTEND_URL.split(",")
    if origin.strip()
]
for default_origin in ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]:
    if default_origin not in allowed_origins:
        allowed_origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*(vercel\.app|netlify\.app|onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.requests import Request
from starlette.responses import Response, JSONResponse
import asyncio

@app.middleware("http")
async def client_disconnect_resilience_middleware(request: Request, call_next):
    """Prevents server crashes when client window/browser tab closes mid-request."""
    try:
        return await call_next(request)
    except (asyncio.CancelledError, ConnectionResetError, BrokenPipeError):
        # Client abruptly closed browser tab or refreshed
        return Response(status_code=499)
    except Exception as exc:
        print(f"[EDU-PULSE SERVER EXCEPTION] {request.method} {request.url.path}: {exc}")
        return JSONResponse(status_code=500, content={"detail": "A server error occurred. Process remained stable."})

# Register routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(professors.router)
app.include_router(admin.router)
app.include_router(attendance.router)
app.include_router(marks.router)
app.include_router(notifications.router)
app.include_router(courses.router)


@app.post("/api/contact")
def direct_contact_endpoint(
    payload: notifications.ContactMessageCreate,
    db: notifications.Session = notifications.Depends(notifications.get_db),
):
    return notifications.submit_contact_message(payload, db)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "EduPulse",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "email_mode": "mock" if settings.MOCK_EMAIL else "gmail",
    }
