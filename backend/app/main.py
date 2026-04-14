from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, run_startup_migrations
from app.api.v1 import api_router

Base.metadata.create_all(bind=engine)
run_startup_migrations()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


def _configured_ai_model() -> str:
    provider = settings.AI_PROVIDER.lower().strip()
    if provider == "gemini":
        return settings.GEMINI_MODEL
    if provider == "openai":
        return settings.OPENAI_MODEL
    if provider == "claude":
        return settings.CLAUDE_MODEL
    if provider == "ollama":
        return settings.OLLAMA_MODEL
    return "unknown"


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "ai_model": _configured_ai_model(),
    }
