from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.security import anti_spam_middleware, auth_middleware
from app.api.v1 import api_router
from alembic.config import Config
from alembic import command

# Run database migrations on startup
alembic_cfg = Config("alembic.ini")
command.upgrade(alembic_cfg, "head")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(anti_spam_middleware)
app.middleware("http")(auth_middleware)

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
