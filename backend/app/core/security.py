import threading
import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.config import settings


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
