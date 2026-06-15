@echo off
cd /d "%~dp0"

echo Starting backend server (FastAPI)...
start /min cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo Starting frontend server (Next.js)...
start /min cmd /k "cd frontend && npm run dev"

echo ----------------------------------------
echo Services are starting in the background!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ----------------------------------------
echo Feel free to close this window.
pause
