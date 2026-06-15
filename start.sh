#!/bin/bash

# Change to script directory
cd "$(dirname "$0")"

echo "Starting backend server (FastAPI)..."
cmd //c start //min cmd //c "cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo "Starting frontend server (Next.js)..."
cmd //c start //min cmd //c "cd frontend && npm run dev"

echo "----------------------------------------"
echo "Services are starting in the background!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "----------------------------------------"
echo "You can check backend/backend.log and frontend/frontend.log for logs."
