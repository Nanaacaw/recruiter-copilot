import os
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings


BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DEFAULT_DATABASE_PATH = os.path.join(BACKEND_DIR, "screening.db").replace("\\", "/")
DEFAULT_DATABASE_URL = f"sqlite:///{DEFAULT_DATABASE_PATH}"


class Settings(BaseSettings):
    APP_NAME: str = "AI Screening Copilot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = DEFAULT_DATABASE_URL
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

    AI_PROVIDER: str = "openai"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "qwen2.5:7b"
    OPENAI_BASE_URL: str = "https://ollama.nayerim.my.id/v1"

    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-3-haiku-20240307"

    OLLAMA_BASE_URL: str = "https://ollama.nayerim.my.id"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    OLLAMA_API_KEY: str = ""

    AI_MAX_RETRIES: int = 3
    AI_RETRY_BASE_DELAY_SECONDS: float = 2.0
    AI_SCREENING_DELAY_SECONDS: float = 1.0
    AI_REQUEST_TIMEOUT_SECONDS: float = 180.0

    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx"]

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_flag(cls, value: Any) -> Any:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "dev", "development"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "prod", "production"}:
                return False
        return value

    class Config:
        env_file = os.path.join(BACKEND_DIR, ".env")


settings = Settings()
