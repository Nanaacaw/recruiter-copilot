# Security Hardening Notes

## Current Baseline

As of 2026-04-20, the app includes two simple protection layers:

- App login with JWT bearer tokens
- In-memory anti-spam rate limiter for sensitive API routes

## App Login

When `AUTH_ENABLED=true`, backend protects `/api/*` routes unless the path is listed in
`AUTH_PUBLIC_PATH_PREFIXES`. The frontend redirects unauthenticated users to `/login`.

Configured in `backend/.env`:

```env
AUTH_ENABLED=true
AUTH_USERNAME=admin
AUTH_PASSWORD=change-this-password
AUTH_SECRET_KEY=change-this-secret-key
AUTH_TOKEN_EXPIRE_MINUTES=720
AUTH_PUBLIC_PATH_PREFIXES=["/api/auth","/api/health"]
```

Before exposing the app publicly, change:

- `AUTH_PASSWORD`
- `AUTH_SECRET_KEY`

Keep `backend/.env` ignored by Git. Only commit `backend/.env.example`.

## Rate Limiting

Backend includes an in-memory anti-spam rate limiter for sensitive API routes.

Default protected prefixes:

- `/api/auth/login`
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
SECURITY_PROTECTED_PATH_PREFIXES=["/api/auth/login","/api/candidates/upload","/api/screening","/api/export"]
SECURITY_RATE_LIMIT_METHODS=["POST","PUT","PATCH","DELETE"]
```

## Limitations

- JWT token is stored in browser localStorage for simplicity.
- This is single-user auth, not role-based access control.
- In-memory limiter resets when backend restarts.
- Not distributed; if multiple backend instances are used, counters are not shared.

## Recommended Next Layer

1. Cloudflare Access for `app.*` and `api.*`
2. Cloudflare WAF + rate-limit rules
3. Move to server-side session cookies or a proper auth provider if multi-user/public usage grows

Detailed runbook:

- See [cloudflare-access.md](./cloudflare-access.md) for exact dashboard steps + verification checklist.
