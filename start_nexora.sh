#!/usr/bin/env bash
# VULTRA Startup Script for Linux / macOS

echo "==================================================="
echo "  VULTRA - Personalised Vulnerability Intelligence"
echo "==================================================="
echo ""

# Start FastAPI backend in background
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload &
BACKEND_PID=$!

# Start Vite frontend
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend running at:  http://127.0.0.1:8001 (PID: $BACKEND_PID)"
echo "API Documentation:   http://127.0.0.1:8001/docs"
echo "Frontend running at: http://127.0.0.1:5173 (PID: $FRONTEND_PID)"
echo "Press Ctrl+C to terminate all processes."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
