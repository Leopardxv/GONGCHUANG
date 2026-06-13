#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/logs"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"

mkdir -p "$RUN_DIR" "$LOG_DIR"

is_port_busy() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

show_port_owner() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN || true
}

require_file() {
  if [ ! -e "$1" ]; then
    echo "Missing required file or directory: $1" >&2
    exit 1
  fi
}

wait_for_url() {
  local url="$1"
  local name="$2"
  local tries=30

  for _ in $(seq 1 "$tries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name is ready: $url"
      return 0
    fi
    sleep 1
  done

  echo "$name did not become ready in ${tries}s. Check logs in $LOG_DIR" >&2
  return 1
}

start_backend() {
  if is_port_busy "$BACKEND_PORT"; then
    echo "Backend port $BACKEND_PORT is already in use:"
    show_port_owner "$BACKEND_PORT"
    return 0
  fi

  require_file "$BACKEND_DIR/.venv/bin/uvicorn"
  require_file "$BACKEND_DIR/.env"

  echo "Starting backend on http://localhost:$BACKEND_PORT ..."
  (
    cd "$BACKEND_DIR"
    nohup .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" \
      > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
  )

  wait_for_url "http://localhost:$BACKEND_PORT/health" "Backend"
}

start_frontend() {
  if is_port_busy "$FRONTEND_PORT"; then
    echo "Frontend port $FRONTEND_PORT is already in use:"
    show_port_owner "$FRONTEND_PORT"
    return 0
  fi

  require_file "$FRONTEND_DIR/node_modules"
  require_file "$FRONTEND_DIR/package.json"

  echo "Starting frontend on http://localhost:$FRONTEND_PORT ..."
  (
    cd "$FRONTEND_DIR"
    nohup npm run dev -- --hostname 0.0.0.0 --port "$FRONTEND_PORT" \
      > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
  )

  wait_for_url "http://localhost:$FRONTEND_PORT" "Frontend"
}

echo "Using local API: http://localhost:$BACKEND_PORT"
echo "Using local WebSocket: ws://localhost:$BACKEND_PORT"

start_backend
start_frontend

echo
echo "All services are running."
echo "Open: http://localhost:$FRONTEND_PORT"
echo "Logs:"
echo "  Backend : $LOG_DIR/backend.log"
echo "  Frontend: $LOG_DIR/frontend.log"
