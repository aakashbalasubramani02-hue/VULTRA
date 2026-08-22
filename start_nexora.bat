@echo off
echo ===================================================
echo   VULTRA - Personalised Vulnerability Intelligence
echo ===================================================
echo.
echo Starting VULTRA FastAPI Backend and Vite Frontend...
echo.

start "VULTRA Backend (FastAPI)" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload"

cd frontend
start "VULTRA Frontend (React/Vite)" cmd /k "npm run dev"
cd ..

echo.
echo ===================================================
echo Backend running at:  http://127.0.0.1:8001
echo API Documentation:   http://127.0.0.1:8001/docs
echo Frontend running at: http://127.0.0.1:5173
echo ===================================================
echo.
