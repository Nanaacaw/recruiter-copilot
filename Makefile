SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -ExecutionPolicy Bypass -Command
.RECIPEPREFIX := >

.DEFAULT_GOAL := help

.PHONY: help setup setup-backend setup-frontend dev public backend frontend frontend-prod lint tunnel-up tunnel-down tunnel-logs status health

help:
>@Write-Host "AI Screening Copilot shortcuts:" -ForegroundColor Cyan
>@Write-Host "  make setup           Install backend + frontend dependencies"
>@Write-Host "  make dev             Run local dev stack (start.bat)"
>@Write-Host "  make public          Run public-safe stack (start-public.bat)"
>@Write-Host "  make backend         Run FastAPI only (localhost:8000)"
>@Write-Host "  make frontend        Run Next.js dev only (localhost:3000)"
>@Write-Host "  make frontend-prod   Build + start Next.js production mode"
>@Write-Host "  make lint            Run frontend lint"
>@Write-Host "  make tunnel-up       Start Cloudflare connector via docker compose"
>@Write-Host "  make tunnel-down     Stop Cloudflare connector"
>@Write-Host "  make tunnel-logs     Follow cloudflared logs"
>@Write-Host "  make status          Show docker compose services"
>@Write-Host "  make health          Quick local health checks"

setup: setup-backend setup-frontend

setup-backend:
>@if (!(Test-Path "backend/venv")) { python -m venv backend/venv }
>@& "backend/venv/Scripts/python.exe" -m pip install --upgrade pip
>@& "backend/venv/Scripts/python.exe" -m pip install -r backend/requirements.txt

setup-frontend:
>@Set-Location frontend; npm install

dev:
>@.\start.bat

public:
>@.\start-public.bat

backend:
>@Set-Location backend; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --reload --port 8000

frontend:
>@Set-Location frontend; npm run dev -- --hostname 0.0.0.0 --port 3000

frontend-prod:
>@Set-Location frontend; npm run build; npm run start -- --hostname 0.0.0.0 --port 3000

lint:
>@Set-Location frontend; npm run lint

tunnel-up:
>@docker compose up -d cloudflared

tunnel-down:
>@docker compose stop cloudflared

tunnel-logs:
>@docker compose logs -f --tail=200 cloudflared

status:
>@docker compose ps

health:
>@curl.exe -sS http://localhost:8000/api/health
>@curl.exe -sS -o NUL -w "frontend http status: %{http_code}`n" http://localhost:3000
