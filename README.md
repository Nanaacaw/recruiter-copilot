# AI Screening Copilot

AI Screening Copilot adalah aplikasi full-stack untuk bantu tim HR melakukan:

- manajemen job description
- upload dan parsing CV
- AI screening + ranking kandidat
- export hasil screening (PDF/Excel)

Stack utama:

- Frontend: Next.js (App Router, TypeScript, Tailwind)
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL 16 (Docker) / SQLite (local dev)
- AI: Gemini (recommended), OpenAI-compatible endpoint, Claude, atau Ollama

## Quick Start (Docker)

Prasyarat:

- Docker Desktop
- GNU Make (opsional, tapi direkomendasikan)

1. Clone repo dan masuk folder project.
2. Buat file environment:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Edit `backend/.env` dan set API key untuk provider AI yang ingin digunakan:

```env
# Recommended: Gemini (rate limit lebih longgar)
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash
```

4. Build dan jalankan semua service:

```bash
make docker-build
make docker-up
```

5. Akses aplikasi:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs` (hanya saat `DEBUG=true`)

## Quick Start (Local Dev)

Prasyarat:

- Python 3.10+
- Node.js 20+ + npm
- GNU Make (opsional)

1. Install dependency:

```bash
make setup
```

2. Jalankan backend dan frontend di terminal terpisah:

```bash
# Terminal 1: Backend
cd backend && venv\Scripts\python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

3. Akses:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## AI Provider Configuration

Konfigurasi AI provider ada di `backend/.env`. Pilih salah satu:

### Gemini (Recommended)

Rate limit lebih longgar, cocok untuk screening banyak CV sekaligus.

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-2.0-flash
```

### OpenAI-compatible (OpenRouter, Ollama gateway)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=model-name
```

> **Catatan:** Model free tier di OpenRouter (suffix `:free`) punya rate limit sangat ketat (~1-2 request/menit). Gunakan model berbayar atau switch ke Gemini untuk screening batch.

### Claude

```env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your-api-key
CLAUDE_MODEL=claude-3-haiku-20240307
```

### Ollama (Self-hosted)

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

### Rate Limit Protection

```env
AI_MAX_RETRIES=3              # Jumlah retry saat error 429/500
AI_RETRY_BASE_DELAY_SECONDS=5 # Base delay untuk exponential backoff
AI_SCREENING_DELAY_SECONDS=3  # Delay antar screening (untuk batch)
AI_REQUEST_TIMEOUT_SECONDS=300
```

## Public Access via Cloudflare Tunnel

Mode ini untuk expose aplikasi ke internet tanpa VPS.

1. Pastikan `TUNNEL_TOKEN` sudah terisi di `.env`.
2. Jalankan connector tunnel:

```bash
make tunnel-up
```

3. Pantau log tunnel:

```bash
make tunnel-logs
```

Route yang direkomendasikan di Cloudflare:

- `app.nanacaw.my.id` -> `http://host.docker.internal:3000`
- `api.nanacaw.my.id` -> `http://host.docker.internal:8000`

## Command Shortcuts (Makefile)

### Local Dev (no Docker)

| Command | Keterangan |
|---------|------------|
| `make setup` | Install backend + frontend dependency |
| `make dev` | Info cara jalankan backend + frontend |
| `make lint` | Run ESLint frontend |

### Docker (Production)

| Command | Keterangan |
|---------|------------|
| `make docker-build` | Build semua Docker images |
| `make docker-up` | Start semua service (db, backend, frontend, cloudflared) |
| `make docker-down` | Stop dan remove semua container |
| `make docker-logs` | Follow logs semua service |
| `make docker-ps` | Lihat container yang running |

### Tunnel

| Command | Keterangan |
|---------|------------|
| `make tunnel-up` | Start cloudflared saja |
| `make tunnel-down` | Stop cloudflared |
| `make tunnel-logs` | Follow cloudflared logs |

### Other

| Command | Keterangan |
|---------|------------|
| `make health` | Cek backend + frontend health |
| `make help` | Daftar semua command |

## Login and Security

Project ini punya login internal sederhana berbasis JWT. Saat `AUTH_ENABLED=true`, semua route `/api/*`
akan butuh token login kecuali endpoint public seperti `/api/auth/*` dan `/api/health`.

Konfigurasinya ada di `backend/.env`:

```env
AUTH_ENABLED=true
AUTH_USERNAME=admin
AUTH_PASSWORD=change-this-strong-password
AUTH_SECRET_KEY=change-this-to-a-random-32-char-string-minimum
AUTH_TOKEN_EXPIRE_MINUTES=720
AUTH_PUBLIC_PATH_PREFIXES=["/api/auth","/api/health"]
```

Sebelum expose ke internet, ganti minimal:

- `AUTH_PASSWORD`: password login yang kuat
- `AUTH_SECRET_KEY`: string acak panjang untuk signing token

### Rate Limiting

Backend punya in-memory rate limiter untuk endpoint sensitif:

```env
SECURITY_RATE_LIMIT_ENABLED=true
SECURITY_RATE_LIMIT_WINDOW_SECONDS=60
SECURITY_RATE_LIMIT_MAX_REQUESTS=20
SECURITY_PROTECTED_PATH_PREFIXES=["/api/auth/login","/api/candidates/upload","/api/screening","/api/export"]
SECURITY_RATE_LIMIT_METHODS=["POST","PUT","PATCH","DELETE"]
```

### Cloudflare Access (Recommended untuk Production)

1. Aktifkan Cloudflare Access (Zero Trust) di `app.*` dan `api.*`
2. Tambahkan Cloudflare WAF/rate-limit rule untuk endpoint sensitif
3. Tetap gunakan app login ini sebagai pagar kedua

Runbook Cloudflare Access ada di [`docs/cloudflare-access.md`](./docs/cloudflare-access.md).

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Config, database, security
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # AI, CV parser, export
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # UI components
│   │   ├── lib/             # Utilities
│   │   └── types/           # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── docs/                    # Documentation
├── docker-compose.yml       # Full stack services
├── Makefile                 # Command shortcuts
├── .env.example             # Root env template
└── README.md
```

## Documentation

Dokumen detail ada di folder [`docs`](./docs/README.md):

- [Architecture](./docs/architecture.md)
- [System Flows](./docs/system-flows.md)
- [Database](./docs/database.md)
- [API Reference](./docs/api-reference.md)
- [AI Integration](./docs/ai-integration.md)
- [Security](./docs/security.md)
- [Cloudflare Access](./docs/cloudflare-access.md)
