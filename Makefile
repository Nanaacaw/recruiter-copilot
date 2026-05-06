SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -ExecutionPolicy Bypass -Command
.RECIPEPREFIX := >

.DEFAULT_GOAL := help

.PHONY: help dev setup setup-backend setup-frontend lint \
        docker-up docker-down docker-build docker-logs docker-ps \
        tunnel-up tunnel-down tunnel-logs health

help:
> @Write-Host "AI Screening Copilot shortcuts:" -ForegroundColor Cyan
> @Write-Host ""
> @Write-Host "  --- Local Dev (no Docker) ---"
> @Write-Host "  make setup            Install backend + frontend dependencies"
> @Write-Host "  make dev              Run backend + frontend locally (separate terminals)"
> @Write-Host "  make lint             Run frontend ESLint"
> @Write-Host ""
> @Write-Host "  --- Docker (Production) ---"
> @Write-Host "  make docker-build     Build all Docker images"
> @Write-Host "  make docker-up        Start all services (db, backend, frontend, cloudflared)"
> @Write-Host "  make docker-down      Stop and remove all containers"
> @Write-Host "  make docker-logs      Follow logs for all services"
> @Write-Host "  make docker-ps        Show running containers"
> @Write-Host ""
> @Write-Host "  --- Tunnel ---"
> @Write-Host "  make tunnel-up        Start only cloudflared"
> @Write-Host "  make tunnel-down      Stop cloudflared"
> @Write-Host "  make tunnel-logs      Follow cloudflared logs"
> @Write-Host ""
> @Write-Host "  make health           Quick local health check"

# ── Local Dev ─────────────────────────────────────────────────────────────────

setup: setup-backend setup-frontend

setup-backend:
> @if (!(Test-Path "backend/venv")) { python -m venv backend/venv }
> @& "backend/venv/Scripts/python.exe" -m pip install --upgrade pip
> @& "backend/venv/Scripts/python.exe" -m pip install -r backend/requirements.txt

setup-frontend:
> @Set-Location frontend; npm install

dev:
> @Write-Host "Start backend: cd backend && venv\Scripts\python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Yellow
> @Write-Host "Start frontend: cd frontend && npm run dev" -ForegroundColor Yellow

lint:
> @Set-Location frontend; npm run lint

# ── Docker ────────────────────────────────────────────────────────────────────

docker-build:
> @docker compose build

docker-up:
> @docker compose up -d

docker-down:
> @docker compose down

docker-logs:
> @docker compose logs -f --tail=200

docker-ps:
> @docker compose ps

# ── Tunnel ────────────────────────────────────────────────────────────────────

tunnel-up:
> @docker compose up -d cloudflared

tunnel-down:
> @docker compose stop cloudflared

tunnel-logs:
> @docker compose logs -f --tail=200 cloudflared

# ── Health ────────────────────────────────────────────────────────────────────

health:
> @curl.exe -sS http://localhost:8000/api/health
> @curl.exe -sS -o NUL -w "frontend http status: %{http_code}`n" http://localhost:3000
