import json
import os
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings


DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@db:5432/ai_screening"
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://app.nanacaw.my.id",
    "http://app.nanacaw.my.id",
]
DEFAULT_SECURITY_PROTECTED_PATH_PREFIXES = [
    "/api/auth/login",
    "/api/candidates/upload",
    "/api/screening",
    "/api/export",
]
DEFAULT_SECURITY_RATE_LIMIT_METHODS = ["POST", "PUT", "PATCH", "DELETE"]
DEFAULT_AUTH_PUBLIC_PATH_PREFIXES = [
    "/api/auth",
    "/api/health",
]


def _parse_env_list(value: Any, fallback: list[str]) -> Any:
    if isinstance(value, str):
        normalized = value.strip()
        if not normalized:
            return fallback.copy()

        if normalized.startswith("["):
            try:
                parsed = json.loads(normalized)
            except json.JSONDecodeError:
                parsed = None
            else:
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]

        return [item.strip() for item in normalized.split(",") if item.strip()]

    return value


class Settings(BaseSettings):
    APP_NAME: str = "AI Screening Copilot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = DEFAULT_DATABASE_URL
    UPLOAD_DIR: str = "/app/uploads"

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
    AI_SCREENING_MAX_CV_CHARS: int = 12000
    AI_SCREENING_MAX_JD_CHARS: int = 5000
    OPENAI_SCREENING_MAX_TOKENS: int = 0

    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx"]

    CORS_ORIGINS: list[str] = DEFAULT_CORS_ORIGINS.copy()

    AUTH_ENABLED: bool = True
    AUTH_USERNAME: str = "admin"
    AUTH_PASSWORD: str = "change-this-password"
    AUTH_SECRET_KEY: str = "change-this-secret-key"
    AUTH_TOKEN_EXPIRE_MINUTES: int = 720
    AUTH_PUBLIC_PATH_PREFIXES: list[str] = DEFAULT_AUTH_PUBLIC_PATH_PREFIXES.copy()

    SECURITY_RATE_LIMIT_ENABLED: bool = True
    SECURITY_RATE_LIMIT_WINDOW_SECONDS: int = 60
    SECURITY_RATE_LIMIT_MAX_REQUESTS: int = 20
    SECURITY_PROTECTED_PATH_PREFIXES: list[str] = DEFAULT_SECURITY_PROTECTED_PATH_PREFIXES.copy()
    SECURITY_RATE_LIMIT_METHODS: list[str] = DEFAULT_SECURITY_RATE_LIMIT_METHODS.copy()

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

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> Any:
        return _parse_env_list(value, DEFAULT_CORS_ORIGINS)

    @field_validator("SECURITY_PROTECTED_PATH_PREFIXES", mode="before")
    @classmethod
    def parse_security_protected_path_prefixes(cls, value: Any) -> Any:
        return _parse_env_list(value, DEFAULT_SECURITY_PROTECTED_PATH_PREFIXES)

    @field_validator("AUTH_PUBLIC_PATH_PREFIXES", mode="before")
    @classmethod
    def parse_auth_public_path_prefixes(cls, value: Any) -> Any:
        return _parse_env_list(value, DEFAULT_AUTH_PUBLIC_PATH_PREFIXES)

    @field_validator("SECURITY_RATE_LIMIT_METHODS", mode="before")
    @classmethod
    def parse_security_rate_limit_methods(cls, value: Any) -> Any:
        parsed = _parse_env_list(value, DEFAULT_SECURITY_RATE_LIMIT_METHODS)
        if isinstance(parsed, list):
            return [str(method).upper() for method in parsed if str(method).strip()]
        return parsed

    class Config:
        env_file = ".env"


settings = Settings()
