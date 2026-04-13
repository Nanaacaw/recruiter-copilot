@echo off
echo Starting AI Screening Copilot...
echo.

echo [1/2] Starting Backend (FastAPI)...
start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting Frontend (Next.js)...
start "Frontend - Next.js" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting!
echo Backend:  http://localhost:8000 (API docs: http://localhost:8000/docs)
echo Frontend: http://localhost:3000
echo.
echo IMPORTANT: Set your OPENAI_API_KEY in backend\.env for the Ollama gateway before screening
pause
