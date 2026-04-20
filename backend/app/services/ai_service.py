import json
from typing import Optional

from app.core.config import settings
from app.services.ai_providers import (
    BaseAIProvider,
    GeminiProvider,
    OpenAIProvider,
    ClaudeProvider,
    OllamaProvider,
)


class AIService:
    def __init__(self):
        self._provider: Optional[BaseAIProvider] = None
        self._provider_name: str = ""

    def _get_provider(self) -> BaseAIProvider:
        if self._provider is not None:
            return self._provider

        provider_type = settings.AI_PROVIDER.lower().strip()
        self._provider_name = provider_type
        retry_options = {
            "max_retries": settings.AI_MAX_RETRIES,
            "retry_base_delay": settings.AI_RETRY_BASE_DELAY_SECONDS,
        }

        if provider_type == "gemini":
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not set")
            self._provider = GeminiProvider(
                api_key=settings.GEMINI_API_KEY,
                model=settings.GEMINI_MODEL,
                **retry_options,
            )
        elif provider_type == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is not set")
            self._provider = OpenAIProvider(
                api_key=settings.OPENAI_API_KEY,
                model=settings.OPENAI_MODEL,
                base_url=settings.OPENAI_BASE_URL,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
                screening_max_tokens=settings.OPENAI_SCREENING_MAX_TOKENS,
                **retry_options,
            )
        elif provider_type == "claude":
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY is not set")
            self._provider = ClaudeProvider(
                api_key=settings.ANTHROPIC_API_KEY,
                model=settings.CLAUDE_MODEL,
                **retry_options,
            )
        elif provider_type == "ollama":
            self._provider = OllamaProvider(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
                api_key=settings.OLLAMA_API_KEY,
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
                **retry_options,
            )
        else:
            raise ValueError(f"Unknown AI provider: {provider_type}")

        return self._provider

    def _configured_model_name(self) -> str:
        provider_type = settings.AI_PROVIDER.lower().strip()
        if provider_type == "gemini":
            return settings.GEMINI_MODEL
        if provider_type == "openai":
            return settings.OPENAI_MODEL
        if provider_type == "claude":
            return settings.CLAUDE_MODEL
        if provider_type == "ollama":
            return settings.OLLAMA_MODEL
        return "unknown"

    def provider_metadata(self) -> dict:
        return {
            "provider": settings.AI_PROVIDER.lower().strip(),
            "model": self._configured_model_name(),
        }

    def _attach_metadata(self, result: dict) -> dict:
        enriched = dict(result or {})
        enriched["_meta"] = self.provider_metadata()
        return enriched

    def _truncate(self, value: str, max_chars: int) -> str:
        if max_chars <= 0:
            return value
        if len(value) <= max_chars:
            return value
        return f"{value[:max_chars]}\n\n[truncated]"

    def screen_cv(self, cv_data: dict, jd_data: dict) -> dict:
        cv_text = cv_data.get("raw_text", "") if isinstance(cv_data, dict) else str(cv_data)

        jd_parts = []
        if jd_data.get("title"):
            jd_parts.append(f"Title: {jd_data['title']}")
        if jd_data.get("department"):
            jd_parts.append(f"Department: {jd_data['department']}")
        if jd_data.get("description"):
            jd_parts.append(f"Description: {jd_data['description']}")

        skills = jd_data.get("required_skills", [])
        if skills:
            if isinstance(skills[0], dict):
                skill_names = [s.get("name", str(s)) for s in skills]
            else:
                skill_names = skills
            jd_parts.append(f"Required Skills: {', '.join(skill_names)}")

        if jd_data.get("experience_level"):
            jd_parts.append(f"Experience Level: {jd_data['experience_level']}")
        if jd_data.get("min_experience_years"):
            jd_parts.append(f"Min Experience: {jd_data['min_experience_years']} years")

        edu = jd_data.get("education_requirements", [])
        if edu:
            if isinstance(edu[0], dict):
                edu_text = ", ".join([e.get("level", "") + (f" in {e.get('field','')}" if e.get("field") else "") for e in edu])
            else:
                edu_text = ", ".join(str(e) for e in edu)
            jd_parts.append(f"Education: {edu_text}")

        certs = jd_data.get("certifications", [])
        if certs:
            if isinstance(certs[0], dict):
                cert_text = ", ".join([c.get("name", str(c)) for c in certs])
            else:
                cert_text = ", ".join(str(c) for c in certs)
            jd_parts.append(f"Certifications: {cert_text}")

        jd_text = "\n".join(jd_parts)
        cv_text = self._truncate(cv_text, settings.AI_SCREENING_MAX_CV_CHARS)
        jd_text = self._truncate(jd_text, settings.AI_SCREENING_MAX_JD_CHARS)

        try:
            result = self._get_provider().screen_cv(cv_text, jd_text)
            return self._attach_metadata(result)
        except Exception as e:
            return self._attach_metadata({
                "skills_score": 0, "experience_score": 0, "education_score": 0,
                "certification_score": 0, "overall_fit_score": 0, "overall_score": 0,
                "strengths": [], "weaknesses": [f"AI provider error: {str(e)}"],
                "red_flags": [], "matched_skills": [], "missing_skills": [],
                "summary": f"AI screening failed: {str(e)}"
            })

    @property
    def provider_name(self) -> str:
        try:
            return self._get_provider().name
        except Exception:
            return settings.AI_PROVIDER or "unknown"


ai_service = AIService()
