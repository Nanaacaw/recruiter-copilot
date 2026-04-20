# AI Screening Copilot

AI Screening Copilot adalah aplikasi full-stack untuk bantu tim HR melakukan:

- manajemen job description
- upload dan parsing CV
- AI screening + ranking kandidat
- export hasil screening (PDF/Excel)

Stack utama:

- Frontend: Next.js (App Router, TypeScript, Tailwind)
- Backend: FastAPI + SQLAlchemy
- Database: SQLite (`backend/screening.db`)
- AI: OpenAI-compatible endpoint (default), Gemini, Claude, atau Ollama

## Quick Start (First Run)

Prasyarat:

- Python 3.10+
- Node.js 20+ + npm
- Docker Desktop (untuk cloudflared)
- GNU Make (opsional, tapi direkomendasikan)

1. Clone repo dan masuk folder project.
2. Buat file environment:
   - copy `.env.example` menjadi `.env` (untuk `TUNNEL_TOKEN`)
   - copy `backend/.env.example` menjadi `backend/.env`
   - copy `frontend/.env.example` menjadi `frontend/.env.local` (atau buat manual):

```env
NEXT_PUBLIC_API_URL=/backend-api
```

3. Install dependency:

```bash
make setup
```

4. Jalankan local development:

```bash
make dev
```

Akan menjalankan:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Public Access via Cloudflare Tunnel

Mode ini untuk expose aplikasi lokal ke internet tanpa VPS.

1. Pastikan `TUNNEL_TOKEN` sudah terisi di `.env`.
2. Jalankan aplikasi dalam mode public-safe (tanpa HMR dev tunnel issue):

```bash
make public
```

3. Jalankan connector tunnel:

```bash
make tunnel-up
```

4. Pantau log tunnel:

```bash
make tunnel-logs
```

Route yang direkomendasikan di Cloudflare:

- `app.nanacaw.my.id` -> `http://host.docker.internal:3000`
- `api.nanacaw.my.id` -> `http://host.docker.internal:8000`

## Command Shortcuts (Makefile)

- `make help`: daftar command
- `make setup`: install backend + frontend dependency
- `make dev`: jalankan stack lokal (`start.bat`)
- `make public`: jalankan mode public (`start-public.bat`)
- `make backend`: backend saja
- `make frontend`: frontend dev saja
- `make frontend-prod`: build + start frontend production
- `make lint`: lint frontend
- `make tunnel-up`: start cloudflared
- `make tunnel-down`: stop cloudflared
- `make status`: cek status docker compose
- `make health`: cek backend + frontend lokal

## Security and Auth Recommendation

Kalau app sudah dibuka ke internet, auth sangat direkomendasikan.

Minimum protection yang praktis:

1. Aktifkan Cloudflare Access (Zero Trust) di `app.*` dan `api.*`
2. Tambahkan Cloudflare WAF/rate-limit rule untuk endpoint sensitif (`/api/candidates/upload`, `/api/screening`)
3. (Opsional tapi bagus) Tambah auth di backend:
   - API key untuk internal usage cepat, atau
   - JWT + login role-based kalau mau multi-user

Tanpa lapisan ini, endpoint upload/screening rentan spam traffic dan abuse quota AI.

Runbook Cloudflare Access (recommended) ada di:

- [`docs/cloudflare-access.md`](./docs/cloudflare-access.md)

Project ini sekarang juga sudah punya in-memory rate limiter di backend untuk endpoint sensitif. Konfigurasinya ada di `backend/.env`:

```env
SECURITY_RATE_LIMIT_ENABLED=true
SECURITY_RATE_LIMIT_WINDOW_SECONDS=60
SECURITY_RATE_LIMIT_MAX_REQUESTS=20
SECURITY_PROTECTED_PATH_PREFIXES=["/api/candidates/upload","/api/screening","/api/export"]
SECURITY_RATE_LIMIT_METHODS=["POST","PUT","PATCH","DELETE"]
```

## Project Structure

```text
.
|-- backend/              # FastAPI app
|-- frontend/             # Next.js app
|-- docs/                 # architecture, flows, API, build phases, audit
|-- docker-compose.yml    # cloudflared connector
|-- start.bat             # local dev launcher
|-- start-public.bat      # production-style launcher for tunnel
`-- Makefile              # shortcut commands
```

## Documentation

Dokumen detail ada di folder [`docs`](./docs/README.md):

- architecture
- system flows
- database
- API reference
- AI integration
- build phases
- repository notes
- code audit
- security hardening
- cloudflare access setup
