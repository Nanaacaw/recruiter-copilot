# Security Hardening Notes

## Current Baseline

As of 2026-04-15, backend includes an in-memory anti-spam rate limiter for sensitive API routes.

Default protected prefixes:

- `/api/candidates/upload`
- `/api/screening`
- `/api/export`

Default limits:

- window: 60 seconds
- max requests per IP per method+path: 20

## Environment Variables

Configured in `backend/.env`:

```env
SECURITY_RATE_LIMIT_ENABLED=true
SECURITY_RATE_LIMIT_WINDOW_SECONDS=60
SECURITY_RATE_LIMIT_MAX_REQUESTS=20
SECURITY_PROTECTED_PATH_PREFIXES=["/api/candidates/upload","/api/screening","/api/export"]
SECURITY_RATE_LIMIT_METHODS=["POST","PUT","PATCH","DELETE"]
```

## Limitations

- In-memory limiter resets when backend restarts.
- Not distributed; if multiple backend instances are used, counters are not shared.
- This is anti-spam baseline, not full authentication.

## Recommended Next Layer

1. Cloudflare Access for `app.*` and `api.*`
2. Cloudflare WAF + rate-limit rules
3. Add app-level auth (JWT/session) if multi-user/public usage grows

Detailed runbook:

- See [cloudflare-access.md](./cloudflare-access.md) for exact dashboard steps + verification checklist.
