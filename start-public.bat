@echo off
echo Starting AI Screening Copilot in public mode...
echo.

echo [1/2] Starting Backend (FastAPI)...
start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/2] Starting Frontend (Next.js production)...
start "Frontend - Next.js Prod" cmd /k "cd /d %~dp0frontend && npm run build && npm run start -- --hostname 0.0.0.0 --port 3000"

echo.
echo Public mode is starting!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo Tunnel origin targets:
echo   app.nanacaw.my.id -^> http://host.docker.internal:3000
echo   api.nanacaw.my.id -^> http://host.docker.internal:8000
echo.
echo Use this mode for Cloudflare Tunnel access to avoid dev HMR desync issues.
pause
