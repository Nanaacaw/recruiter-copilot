import json
from abc import ABC, abstractmethod
from collections.abc import Callable
import time
from typing import Any


class BaseAIProvider(ABC):
    name: str = "base"
    max_retries: int = 0
    retry_base_delay: float = 2.0

    def _configure_retries(self, max_retries: int = 0, retry_base_delay: float = 2.0) -> None:
        self.max_retries = max(0, int(max_retries))
        self.retry_base_delay = max(0.1, float(retry_base_delay))

    def _run_with_retries(self, operation: Callable[[], Any]) -> Any:
        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                return operation()
            except Exception as exc:
                last_error = exc
                if attempt >= self.max_retries or not self._is_retryable_error(exc):
                    raise
                time.sleep(self._retry_delay(exc, attempt))
        raise last_error

    def _is_retryable_error(self, error: Exception) -> bool:
        status_code = self._status_code_from_error(error)
        if status_code in {408, 409, 425, 429, 500, 502, 503, 504}:
            return True

        message = str(error).lower()
        return (
            "429" in message
            or "rate limit" in message
            or "too many request" in message
            or "resource exhausted" in message
            or ("quota" in message and "exceeded" in message)
        )

    def _status_code_from_error(self, error: Exception) -> int | None:
        response = getattr(error, "response", None)
        status_code = getattr(response, "status_code", None)
        if status_code is None:
            status_code = getattr(error, "status_code", None)
        if status_code is None:
            status_code = getattr(error, "code", None)
        try:
            return int(status_code)
        except (TypeError, ValueError):
            return None

    def _retry_delay(self, error: Exception, attempt: int) -> float:
        response = getattr(error, "response", None)
        headers = getattr(response, "headers", {}) or {}
        retry_after = headers.get("retry-after") or headers.get("Retry-After")
        if retry_after:
            try:
                return min(float(retry_after), 60.0)
            except ValueError:
                pass
        return min(self.retry_base_delay * (2 ** attempt), 30.0)

    @abstractmethod
    def screen_cv(self, cv_text: str, jd_text: str) -> dict:
        pass

    @abstractmethod
    def generate_interview_questions(
        self, cv_text: str, jd_title: str, screening_result: dict, count: int, difficulty: str
    ) -> list[dict]:
        pass

    def _safe_get(self, d: dict, key: str, default: Any = None) -> Any:
        val = d.get(key, default)
        if val is None:
            return default
        if isinstance(val, str) and not val.strip():
            return default
        return val

    def _ensure_list(self, val) -> list:
        if isinstance(val, list):
            return val
        if isinstance(val, str):
            return [v.strip() for v in val.split(",") if v.strip()]
        return []

    def _json_fragment(self, text: str, strict: bool = False) -> str:
        object_start = text.find("{")
        array_start = text.find("[")
        starts = [idx for idx in (object_start, array_start) if idx != -1]
        if not starts:
            return text if not strict else ""

        start = min(starts)
        closing_char = "]" if text[start] == "[" else "}"
        end = text.rfind(closing_char) + 1
        if end > start:
            return text[start:end]
        return text if not strict else ""


class GeminiProvider(BaseAIProvider):
    name = "gemini"

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.0-flash",
        max_retries: int = 0,
        retry_base_delay: float = 2.0,
    ):
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)
        self._configure_retries(max_retries, retry_base_delay)

    def screen_cv(self, cv_text: str, jd_text: str) -> dict:
        prompt = self._build_screening_prompt(cv_text, jd_text)
        try:
            response = self._run_with_retries(lambda: self.model.generate_content(prompt))
            return self._parse_screening_response(response.text)
        except Exception as e:
            return self._error_result(str(e))

    def generate_interview_questions(
        self, cv_text: str, jd_title: str, screening_result: dict, count: int, difficulty: str
    ) -> list[dict]:
        prompt = self._build_interview_prompt(cv_text, jd_title, screening_result, count, difficulty)
        try:
            response = self._run_with_retries(lambda: self.model.generate_content(prompt))
            return self._parse_questions_response(response.text)
        except Exception as e:
            return []

    def _build_screening_prompt(self, cv_text: str, jd_text: str) -> str:
        return f"""You are an expert HR screening assistant. Analyze the candidate's CV against the job description and provide a detailed screening result.

**JOB DESCRIPTION:**
{jd_text}

**CANDIDATE CV:**
{cv_text}

**INSTRUCTIONS:**
Score the candidate on each dimension (0-100). Be objective and thorough.

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{{
    "skills_score": <0-100>,
    "experience_score": <0-100>,
    "education_score": <0-100>,
    "certification_score": <0-100>,
    "overall_fit_score": <0-100>,
    "overall_score": <weighted 0-100>,
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "red_flags": ["flag1", ...],
    "matched_skills": ["skill1", "skill2", ...],
    "missing_skills": ["skill1", "skill2", ...],
    "summary": "A brief 2-3 sentence overall assessment"
}}"""

    def _build_interview_prompt(
        self, cv_text: str, jd_title: str, screening_result: dict, count: int, difficulty: str
    ) -> str:
        return f"""You are an expert interviewer for the position: {jd_title}

**CANDIDATE PROFILE:**
{cv_text[:2000]}

**SCREENING RESULTS:**
- Skills Score: {screening_result.get('skills_score', 0)}
- Experience Score: {screening_result.get('experience_score', 0)}
- Education Score: {screening_result.get('education_score', 0)}
- Weaknesses: {json.dumps(screening_result.get('weaknesses', []))}
- Missing Skills: {json.dumps(screening_result.get('missing_skills', []))}
- Red Flags: {json.dumps(screening_result.get('red_flags', []))}

Generate {count} interview questions at {difficulty} difficulty level. Focus on probing areas where the candidate has gaps or weaknesses.

Respond with ONLY valid JSON array (no markdown, no explanation):
[
    {{
        "question": "the question text",
        "category": "technical|behavioral|situational",
        "difficulty": "{difficulty}",
        "focus_area": "what skill/gap this targets",
        "evaluation_criteria": "what to look for in the answer"
    }}
]"""

    def _parse_screening_response(self, text: str) -> dict:
        cleaned = self._extract_json(text)
        if not cleaned:
            return self._error_result("Failed to parse AI response")
        try:
            result = json.loads(cleaned)
            return self._normalize_result(result)
        except json.JSONDecodeError:
            return self._error_result("Invalid JSON from AI")

    def _parse_questions_response(self, text: str) -> list[dict]:
        cleaned = self._extract_json(text)
        if not cleaned:
            return []
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return [self._normalize_question(q) for q in parsed if isinstance(q, dict)]
            return []
        except json.JSONDecodeError:
            return []

    def _extract_json(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:] if lines[0].strip() in ["```", "```json", "```python"] else lines)
        if "```" in text:
            text = text[:text.rfind("```")]
        text = text.strip()
        return self._json_fragment(text, strict=True)

    def _normalize_result(self, result: dict) -> dict:
        return {
            "skills_score": float(self._safe_get(result, "skills_score", 0)),
            "experience_score": float(self._safe_get(result, "experience_score", 0)),
            "education_score": float(self._safe_get(result, "education_score", 0)),
            "certification_score": float(self._safe_get(result, "certification_score", 0)),
            "overall_fit_score": float(self._safe_get(result, "overall_fit_score", 0)),
            "overall_score": float(self._safe_get(result, "overall_score", 0)),
            "strengths": self._ensure_list(self._safe_get(result, "strengths", [])),
            "weaknesses": self._ensure_list(self._safe_get(result, "weaknesses", [])),
            "red_flags": self._ensure_list(self._safe_get(result, "red_flags", [])),
            "matched_skills": self._ensure_list(self._safe_get(result, "matched_skills", [])),
            "missing_skills": self._ensure_list(self._safe_get(result, "missing_skills", [])),
            "summary": str(self._safe_get(result, "summary", "")),
        }

    def _normalize_question(self, q: dict) -> dict:
        return {
            "question": str(self._safe_get(q, "question", "")),
            "category": str(self._safe_get(q, "category", "technical")),
            "difficulty": str(self._safe_get(q, "difficulty", "medium")),
            "focus_area": str(self._safe_get(q, "focus_area", "")),
            "evaluation_criteria": str(self._safe_get(q, "evaluation_criteria", "")),
        }

    def _error_result(self, error: str) -> dict:
        return {
            "skills_score": 0, "experience_score": 0, "education_score": 0,
            "certification_score": 0, "overall_fit_score": 0, "overall_score": 0,
            "strengths": [], "weaknesses": [f"AI error: {error}"],
            "red_flags": [], "matched_skills": [], "missing_skills": [],
            "summary": "AI screening failed to process this candidate."
        }


class OpenAIProvider(BaseAIProvider):
    name = "openai"

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        base_url: str = "",
        timeout: float = 180.0,
        max_retries: int = 0,
        retry_base_delay: float = 2.0,
    ):
        self.api_key = api_key
        self.base_url = (base_url or "https://api.openai.com/v1").rstrip("/")
        self.model = model
        self.timeout = timeout
        self._configure_retries(max_retries, retry_base_delay)

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _chat_completion(self, prompt: str, temperature: float, max_tokens: int) -> str:
        import httpx
        response = httpx.post(
            f"{self.base_url}/chat/completions",
            headers=self._get_headers(),
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"].get("content") or ""

    def screen_cv(self, cv_text: str, jd_text: str) -> dict:
        prompt = self._build_screening_prompt(cv_text, jd_text)
        try:
            text = self._run_with_retries(lambda: self._chat_completion(prompt, temperature=0.1, max_tokens=2000))
            return self._parse_response(text)
        except Exception as e:
            return self._error_result(str(e))

    def generate_interview_questions(
        self, cv_text: str, jd_title: str, screening_result: dict, count: int, difficulty: str
    ) -> list[dict]:
        prompt = self._build_interview_prompt(cv_text, jd_title, screening_result, count, difficulty)
        try:
            text = self._run_with_retries(lambda: self._chat_completion(prompt, temperature=0.5, max_tokens=3000))
            return self._parse_questions(text)
        except Exception:
            return []

    def _build_screening_prompt(self, cv_text: str, jd_text: str) -> str:
        return f"""You are an expert HR screening assistant. Analyze the candidate's CV against the job description and provide a detailed screening result.

**JOB DESCRIPTION:**
{jd_text}

**CANDIDATE CV:**
{cv_text}

Respond with ONLY valid JSON (no markdown, no explanation):
{{
    "skills_score": <0-100>,
    "experience_score": <0-100>,
    "education_score": <0-100>,
    "certification_score": <0-100>,
    "overall_fit_score": <0-100>,
    "overall_score": <weighted 0-100>,
    "strengths": ["strength1", ...],
    "weaknesses": ["weakness1", ...],
    "red_flags": ["flag1", ...],
    "matched_skills": ["skill1", ...],
    "missing_skills": ["skill1", ...],
    "summary": "A brief 2-3 sentence overall assessment"
}}"""

    def _build_interview_prompt(
        self, cv_text: str, jd_title: str, screening_result: dict, count: int, difficulty: str
    ) -> str:
        return f"""Generate {count} interview questions at {difficulty} difficulty for position: {jd_title}

Candidate profile: {cv_text[:2000]}
Screening: skills={screening_result.get('skills_score', 0)}, exp={screening_result.get('experience_score', 0)}
Weaknesses: {screening_result.get('weaknesses', [])}
Missing: {screening_result.get('missing_skills', [])}

Respond with ONLY valid JSON array:
[
    {{
        "question": "...",
        "category": "technical|behavioral|situational",
        "difficulty": "{difficulty}",
        "focus_area": "...",
        "evaluation_criteria": "..."
    }}
]"""

    def _parse_response(self, text: str) -> dict:
        cleaned = self._extract_json(text)
        if not cleaned:
            return self._error_result("Failed to parse response")
        try:
            result = json.loads(cleaned)
            return self._normalize_result(result)
        except json.JSONDecodeError:
            return self._error_result("Invalid JSON")

    def _parse_questions(self, text: str) -> list[dict]:
        cleaned = self._extract_json(text)
        if not cleaned:
            return []
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return [self._normalize_question(q) for q in parsed if isinstance(q, dict)]
            return []
        except json.JSONDecodeError:
            return []

    def _extract_json(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:] if lines[0].strip() in ["```", "```json"] else lines)
        if "```" in text:
            text = text[:text.rfind("```")]
        text = text.strip()
        return self._json_fragment(text)

    def _normalize_result(self, result: dict) -> dict:
        return {
            "skills_score": float(self._safe_get(result, "skills_score", 0)),
            "experience_score": float(self._safe_get(result, "experience_score", 0)),
            "education_score": float(self._safe_get(result, "education_score", 0)),
            "certification_score": float(self._safe_get(result, "certification_score", 0)),
            "overall_fit_score": float(self._safe_get(result, "overall_fit_score", 0)),
            "overall_score": float(self._safe_get(result, "overall_score", 0)),
            "strengths": self._ensure_list(self._safe_get(result, "strengths", [])),
            "weaknesses": self._ensure_list(self._safe_get(result, "weaknesses", [])),
            "red_flags": self._ensure_list(self._safe_get(result, "red_flags", [])),
            "matched_skills": self._ensure_list(self._safe_get(result, "matched_skills", [])),
            "missing_skills": self._ensure_list(self._safe_get(result, "missing_skills", [])),
            "summary": str(self._safe_get(result, "summary", "")),
        }

    def _normalize_question(self, q: dict) -> dict:
        return {
            "question": str(self._safe_get(q, "question", "")),
            "category": str(self._safe_get(q, "category", "technical")),
            "difficulty": str(self._safe_get(q, "difficulty", "medium")),
            "focus_area": str(self._safe_get(q, "focus_area", "")),
            "evaluation_criteria": str(self._safe_get(q, "evaluation_criteria", "")),
        }

    def _error_result(self, error: str) -> dict:
        return {
            "skills_score": 0, "experience_score": 0, "education_score": 0,
            "certification_score": 0, "overall_fit_score": 0, "overall_score": 0,
            "strengths": [], "weaknesses": [f"AI error: {error}"],
            "red_flags": [], "matched_skills": [], "missing_skills": [],
            "summary": "AI screening failed."
        }


class ClaudeProvider(BaseAIProvider):
    name = "claude"

    def __init__(
        self,
        api_key: str,
        model: str = "claude-3-haiku-20240307",
        max_retries: int = 0,
        retry_base_delay: float = 2.0,
    ):
        from anthropic import Anthropic
        self.client = Anthropic(api_key=api_key)
        self.model = model
        self._configure_retries(max_retries, retry_base_delay)

    def screen_cv(self, cv_text: str, jd_text: str) -> dict:
        prompt = self._build_screening_prompt(cv_text, jd_text)
        try:
            response = self._run_with_retries(
                lambda: self.client.messages.create(
                    model=self.model,
                    max_tokens=2000,
                    messages=[{"role": "user", "content": prompt}],
                )
            )
            return self._parse_response(response.content[0].text)
        except Exception as e:
            return self._error_result(str(e))

    def generate_interview_questions(
        self, cv_text: str, jd_title: str, screening_result: dict, count: int, difficulty: str
    ) -> list[dict]:
        prompt = self._build_interview_prompt(cv_text, jd_title, screening_result, count, difficulty)
        try:
            response = self._run_with_retries(
                lambda: self.client.messages.create(
                    model=self.model,
                    max_tokens=3000,
                    messages=[{"role": "user", "content": prompt}],
                )
            )
            return self._parse_questions(response.content[0].text)
        except Exception:
            return []

    def _build_screening_prompt(self, cv_text: str, jd_text: str) -> str:
        return f"""You are an expert HR screening assistant. Analyze the candidate's CV against the job description and provide a detailed screening result.

**JOB DESCRIPTION:**
{jd_text}

**CANDIDATE CV:**
{cv_text}

Respond with ONLY valid JSON (no markdown):
{{
    "skills_score": <0-100>,
    "experience_score": <0-100>,
    "education_score": <0-100>,
    "certification_score": <0-100>,
    "overall_fit_score": <0-100>,
    "overall_score": <weighted 0-100>,
    "strengths": ["strength1", ...],
    "weaknesses": ["weakness1", ...],
    "red_flags": ["flag1", ...],
    "matched_skills": ["skill1", ...],
    "missing_skills": ["skill1", ...],
    "summary": "A brief assessment"
}}"""

    def _build_interview_prompt(
        self, cv_text: str, jd_title: str, screening_result: dict, count: int, difficulty: str
    ) -> str:
        return f"""Generate {count} interview questions at {difficulty} difficulty for: {jd_title}

Candidate: {cv_text[:2000]}
Scores: skills={screening_result.get('skills_score', 0)}, exp={screening_result.get('experience_score', 0)}
Gaps: {screening_result.get('weaknesses', [])}
Missing: {screening_result.get('missing_skills', [])}

JSON array only:
[
    {{"question": "...", "category": "technical|behavioral|situational", "difficulty": "{difficulty}", "focus_area": "...", "evaluation_criteria": "..."}}
]"""

    def _parse_response(self, text: str) -> dict:
        cleaned = self._extract_json(text)
        if not cleaned:
            return self._error_result("Parse failed")
        try:
            result = json.loads(cleaned)
            return self._normalize_result(result)
        except json.JSONDecodeError:
            return self._error_result("Invalid JSON")

    def _parse_questions(self, text: str) -> list[dict]:
        cleaned = self._extract_json(text)
        if not cleaned:
            return []
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return [self._normalize_question(q) for q in parsed if isinstance(q, dict)]
            return []
        except json.JSONDecodeError:
            return []

    def _extract_json(self, text: str) -> str:
        text = text.strip()
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.rfind("```")
            return text[start:end].strip()
        if "```" in text:
            text = text.replace("```", "")
        text = text.strip()
        return self._json_fragment(text)

    def _normalize_result(self, result: dict) -> dict:
        return {
            "skills_score": float(self._safe_get(result, "skills_score", 0)),
            "experience_score": float(self._safe_get(result, "experience_score", 0)),
            "education_score": float(self._safe_get(result, "education_score", 0)),
            "certification_score": float(self._safe_get(result, "certification_score", 0)),
            "overall_fit_score": float(self._safe_get(result, "overall_fit_score", 0)),
            "overall_score": float(self._safe_get(result, "overall_score", 0)),
            "strengths": self._ensure_list(self._safe_get(result, "strengths", [])),
            "weaknesses": self._ensure_list(self._safe_get(result, "weaknesses", [])),
            "red_flags": self._ensure_list(self._safe_get(result, "red_flags", [])),
            "matched_skills": self._ensure_list(self._safe_get(result, "matched_skills", [])),
            "missing_skills": self._ensure_list(self._safe_get(result, "missing_skills", [])),
            "summary": str(self._safe_get(result, "summary", "")),
        }

    def _normalize_question(self, q: dict) -> dict:
        return {
            "question": str(self._safe_get(q, "question", "")),
            "category": str(self._safe_get(q, "category", "technical")),
            "difficulty": str(self._safe_get(q, "difficulty", "medium")),
            "focus_area": str(self._safe_get(q, "focus_area", "")),
            "evaluation_criteria": str(self._safe_get(q, "evaluation_criteria", "")),
        }

    def _error_result(self, error: str) -> dict:
        return {
            "skills_score": 0, "experience_score": 0, "education_score": 0,
            "certification_score": 0, "overall_fit_score": 0, "overall_score": 0,
            "strengths": [], "weaknesses": [f"AI error: {error}"],
            "red_flags": [], "matched_skills": [], "missing_skills": [],
            "summary": "AI screening failed."
        }


class OllamaProvider(BaseAIProvider):
    name = "ollama"

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "llama3.2",
        api_key: str = "",
        timeout: float = 180.0,
        max_retries: int = 0,
        retry_base_delay: float = 2.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_key = api_key
        self.timeout = timeout
        self._configure_retries(max_retries, retry_base_delay)

    def _get_headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _generate(self, prompt: str) -> str:
        import httpx
        response = httpx.post(
            f"{self.base_url}/api/generate",
            headers=self._get_headers(),
            json={"model": self.model, "prompt": prompt, "stream": False},
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json().get("response", "")

    def screen_cv(self, cv_text: str, jd_text: str) -> dict:
        prompt = self._build_screening_prompt(cv_text, jd_text)
        try:
            text = self._run_with_retries(lambda: self._generate(prompt))
            return self._parse_response(text)
        except Exception as e:
            return self._error_result(str(e))

    def generate_interview_questions(
        self, cv_text: str, jd_title: str, screening_result: dict, count: int, difficulty: str
    ) -> list[dict]:
        prompt = self._build_interview_prompt(cv_text, jd_title, screening_result, count, difficulty)
        try:
            text = self._run_with_retries(lambda: self._generate(prompt))
            return self._parse_questions(text)
        except Exception:
            return []

    def _build_screening_prompt(self, cv_text: str, jd_text: str) -> str:
        return f"""You are an expert HR screening assistant. Analyze the candidate's CV against the job description and provide a detailed screening result.

**JOB DESCRIPTION:**
{jd_text}

**CANDIDATE CV:**
{cv_text}

Respond with ONLY valid JSON:
{{
    "skills_score": <0-100>,
    "experience_score": <0-100>,
    "education_score": <0-100>,
    "certification_score": <0-100>,
    "overall_fit_score": <0-100>,
    "overall_score": <weighted 0-100>,
    "strengths": ["strength1", ...],
    "weaknesses": ["weakness1", ...],
    "red_flags": ["flag1", ...],
    "matched_skills": ["skill1", ...],
    "missing_skills": ["skill1", ...],
    "summary": "A brief assessment"
}}"""

    def _build_interview_prompt(
        self, cv_text: str, jd_title: str, screening_result: dict, count: int, difficulty: str
    ) -> str:
        return f"""Generate {count} interview questions at {difficulty} difficulty for: {jd_title}

Candidate: {cv_text[:2000]}
Gaps: {screening_result.get('weaknesses', [])}
Missing: {screening_result.get('missing_skills', [])}

JSON array:
[
    {{"question": "...", "category": "technical|behavioral|situational", "difficulty": "{difficulty}", "focus_area": "...", "evaluation_criteria": "..."}}
]"""

    def _parse_response(self, text: str) -> dict:
        cleaned = self._extract_json(text)
        if not cleaned:
            return self._error_result("Parse failed")
        try:
            result = json.loads(cleaned)
            return self._normalize_result(result)
        except json.JSONDecodeError:
            return self._error_result("Invalid JSON")

    def _parse_questions(self, text: str) -> list[dict]:
        cleaned = self._extract_json(text)
        if not cleaned:
            return []
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return [self._normalize_question(q) for q in parsed if isinstance(q, dict)]
            return []
        except json.JSONDecodeError:
            return []

    def _extract_json(self, text: str) -> str:
        text = text.strip()
        return self._json_fragment(text)

    def _normalize_result(self, result: dict) -> dict:
        return {
            "skills_score": float(self._safe_get(result, "skills_score", 0)),
            "experience_score": float(self._safe_get(result, "experience_score", 0)),
            "education_score": float(self._safe_get(result, "education_score", 0)),
            "certification_score": float(self._safe_get(result, "certification_score", 0)),
            "overall_fit_score": float(self._safe_get(result, "overall_fit_score", 0)),
            "overall_score": float(self._safe_get(result, "overall_score", 0)),
            "strengths": self._ensure_list(self._safe_get(result, "strengths", [])),
            "weaknesses": self._ensure_list(self._safe_get(result, "weaknesses", [])),
            "red_flags": self._ensure_list(self._safe_get(result, "red_flags", [])),
            "matched_skills": self._ensure_list(self._safe_get(result, "matched_skills", [])),
            "missing_skills": self._ensure_list(self._safe_get(result, "missing_skills", [])),
            "summary": str(self._safe_get(result, "summary", "")),
        }

    def _normalize_question(self, q: dict) -> dict:
        return {
            "question": str(self._safe_get(q, "question", "")),
            "category": str(self._safe_get(q, "category", "technical")),
            "difficulty": str(self._safe_get(q, "difficulty", "medium")),
            "focus_area": str(self._safe_get(q, "focus_area", "")),
            "evaluation_criteria": str(self._safe_get(q, "evaluation_criteria", "")),
        }

    def _error_result(self, error: str) -> dict:
        return {
            "skills_score": 0, "experience_score": 0, "education_score": 0,
            "certification_score": 0, "overall_fit_score": 0, "overall_score": 0,
            "strengths": [], "weaknesses": [f"AI error: {error}"],
            "red_flags": [], "matched_skills": [], "missing_skills": [],
            "summary": "AI screening failed."
        }
