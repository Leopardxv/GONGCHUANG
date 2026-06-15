#!/bin/bash

# Change to script directory
cd "$(dirname "$0")"

echo "Stopping services..."

# Kill process on port 8000 (Backend uvicorn)
PORT_8000_PID=$(netstat -ano | grep 8000 | grep LISTENING | awk '{print $5}' | head -n 1 | tr -d '\r')
if [ ! -z "$PORT_8000_PID" ]; then
  echo "Killing backend process on port 8000 (PID: $PORT_8000_PID)..."
  taskkill //F //PID $PORT_8000_PID 2>/dev/null || kill -9 $PORT_8000_PID 2>/dev/null
fi

# Kill process on port 3000 (Frontend Next.js)
PORT_3000_PID=$(netstat -ano | grep 3000 | grep LISTENING | awk '{print $5}' | head -n 1 | tr -d '\r')
if [ ! -z "$PORT_3000_PID" ]; then
  echo "Killing frontend process on port 3000 (PID: $PORT_3000_PID)..."
  taskkill //F //PID $PORT_3000_PID 2>/dev/null || kill -9 $PORT_3000_PID 2>/dev/null
fi

# Clean up PID files if they exist
[ -f .backend.pid ] && rm .backend.pid
[ -f .frontend.pid ] && rm .frontend.pid

echo "All services stopped."
