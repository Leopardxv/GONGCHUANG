#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"

stop_pid_file() {
  local name="$1"
  local pid_file="$2"

  if [ ! -f "$pid_file" ]; then
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"
  if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
    echo "Stopping $name PID $pid ..."
    kill "$pid" >/dev/null 2>&1 || true
  fi

  rm -f "$pid_file"
}

wait_for_port_free() {
  local port="$1"
  local tries=10

  for _ in $(seq 1 "$tries"); do
    if ! lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done

  return 1
}

stop_port() {
  local name="$1"
  local port="$2"
  local pids

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -z "$pids" ]; then
    echo "$name port $port is not running."
    return 0
  fi

  echo "Stopping $name process on port $port: $pids"
  kill $pids >/dev/null 2>&1 || true

  if wait_for_port_free "$port"; then
    echo "$name port $port stopped."
    return 0
  fi

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "$name did not stop cleanly, forcing: $pids"
    kill -9 $pids >/dev/null 2>&1 || true
  fi

  if wait_for_port_free "$port"; then
    echo "$name port $port stopped."
  else
    echo "Warning: $name port $port is still in use:" >&2
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >&2 || true
  fi
}

stop_pid_file "frontend" "$FRONTEND_PID_FILE"
stop_pid_file "backend" "$BACKEND_PID_FILE"

sleep 1

stop_port "frontend" "$FRONTEND_PORT"
stop_port "backend" "$BACKEND_PORT"

echo "Local services stopped."
