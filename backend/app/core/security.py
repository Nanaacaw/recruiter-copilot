import threading
import time
from datetime import datetime, timedelta, timezone
from secrets import compare_digest
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError, jwt

from app.core.config import settings

AUTH_ALGORITHM = "HS256"


class InMemoryRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max(1, int(max_requests))
        self.window_seconds = max(1, int(window_seconds))
        self._lock = threading.Lock()
        self._requests: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> tuple[bool, int]:
        now = time.monotonic()

        with self._lock:
            bucket = self._requests[key]
            while bucket and (now - bucket[0]) > self.window_seconds:
                bucket.popleft()

            if len(bucket) >= self.max_requests:
                retry_after = max(1, int(self.window_seconds - (now - bucket[0])))
                return False, retry_after

            bucket.append(now)
            return True, 0


rate_limiter = InMemoryRateLimiter(
    max_requests=settings.SECURITY_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=settings.SECURITY_RATE_LIMIT_WINDOW_SECONDS,
)


def _is_protected_path(path: str) -> bool:
    prefixes = settings.SECURITY_PROTECTED_PATH_PREFIXES or []
    return any(path.startswith(prefix) for prefix in prefixes)


def _is_protected_method(method: str) -> bool:
    allowed_methods = {m.upper() for m in (settings.SECURITY_RATE_LIMIT_METHODS or [])}
    return method.upper() in allowed_methods


def create_access_token(username: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.AUTH_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": username,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.AUTH_SECRET_KEY, algorithm=AUTH_ALGORITHM)


def verify_login(username: str, password: str) -> bool:
    configured_username = settings.AUTH_USERNAME or ""
    configured_password = settings.AUTH_PASSWORD or ""
    return compare_digest(username, configured_username) and compare_digest(password, configured_password)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET_KEY, algorithms=[AUTH_ALGORITHM])
    except JWTError:
        return None

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        return None
    return subject


def _extract_bearer_token(request: Request) -> str:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return ""
    return token.strip()


def _is_auth_public_path(path: str) -> bool:
    prefixes = settings.AUTH_PUBLIC_PATH_PREFIXES or []
    return any(path.startswith(prefix) for prefix in prefixes)


async def auth_middleware(request: Request, call_next):
    if not settings.AUTH_ENABLED:
        return await call_next(request)

    path = request.url.path
    if request.method.upper() == "OPTIONS" or not path.startswith("/api") or _is_auth_public_path(path):
        return await call_next(request)

    token = _extract_bearer_token(request)
    username = decode_access_token(token) if token else None
    if not username:
        return JSONResponse(
            status_code=401,
            content={"detail": "Authentication required. Please log in again."},
        )

    request.state.auth_user = username
    return await call_next(request)


def _extract_client_ip(request: Request) -> str:
    cloudflare_ip = request.headers.get("cf-connecting-ip")
    if cloudflare_ip:
        return cloudflare_ip.strip()

    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client and request.client.host:
        return request.client.host

    return "unknown"


async def anti_spam_middleware(request: Request, call_next):
    if not settings.SECURITY_RATE_LIMIT_ENABLED:
        return await call_next(request)

    path = request.url.path
    method = request.method.upper()

    if not _is_protected_path(path) or not _is_protected_method(method):
        return await call_next(request)

    client_ip = _extract_client_ip(request)
    key = f"{method}:{path}:{client_ip}"
    allowed, retry_after = rate_limiter.allow(key)

    if not allowed:
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Too many requests. Please retry after a short delay.",
                "retry_after_seconds": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )

    return await call_next(request)
