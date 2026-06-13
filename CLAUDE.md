# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

```bash
# Infrastructure (PostgreSQL 16 + Redis 7)
docker compose -f docker/docker-compose.yml up -d

# Backend (Python 3.12, venv at backend/.venv)
cd backend && source .venv/bin/activate && pip install -r requirements.txt
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Frontend (Next.js 15)
cd frontend && npm install
cd frontend && npm run dev          # :3000, API at :8000

# Build student Docker image (one-time)
bash scripts/build_student_image.sh

# Lint
cd frontend && npm run lint         # next lint (ESLint)
cd backend && ruff check .          # ruff configured in pyproject.toml (line-length=100)

# DB setup (after first docker compose up)
python -c "import asyncio; from app.database import engine; from app.models.base import Base; from app.modules.auth.model import User; from app.modules.terminal.model import DockerInstance, TerminalLog; from app.modules.ai.model import AIAnalysisLog; async def init(): async with engine.begin() as conn: await conn.run_sync(Base.metadata.create_all); asyncio.run(init())"
```

No test suite exists yet.

## Architecture

**Full-stack AI-enhanced Linux learning platform.** Students use a real bash terminal (Docker container per user, xterm.js) with AI-powered command analysis (DeepSeek API) delivered over WebSocket.

```
Browser (Next.js :3000) ──REST──▶ FastAPI (:8000) ──asyncpg──▶ PostgreSQL
         │                              │
         └──WebSocket──▶ FastAPI ──docker-py──▶ Ubuntu containers (one per user)
                                        │
                                   EventBus ──▶ AI (DeepSeek) analysis (async, non-blocking)
```

### Backend (`backend/app/`)

- **FastAPI** app created in `main.py` with lifespan, CORS, and module routers.
- **Three modules** with layered architecture (model → repository → service → router → schema):
  - `modules/auth/` — JWT cookie auth (register, login, logout, me, stats)
  - `modules/terminal/` — Docker container lifecycle, persistent bash exec sessions, WebSocket gateway
  - `modules/ai/` — DeepSeek-driven command analysis and AI chat
- **Event bus** (`events/event_bus.py`): lightweight in-memory asyncio pub/sub. `command_executed` events are published by the terminal module and consumed by `events/ai_subscriber.py`, which invokes the AI service and pushes results back over WebSocket — **terminal output must arrive first; AI runs in parallel, never blocking the shell.**
- **Auth middleware** (`middleware/auth.py`): `ws_auth()` reads the `access_token` HttpOnly cookie from the WebSocket handshake. Do NOT pass tokens in query params.
- **Config** (`config.py`): all settings via pydantic-settings with `LL_` env prefix. `.env` lives at `backend/.env`, not project root.
- **Database** (`database.py`): async SQLAlchemy 2.0 + asyncpg. `async_session` factory; use via `get_db()` dependency.

### Frontend (`frontend/`)

- **Next.js 15 App Router** with route groups: `(auth)/` (login, register), `(student)/` (playground), `teacher/`.
- **State:** Zustand v5 stores in `stores/` — one per domain (auth, terminal, ai, layout).
- **API:** `services/api.ts` — `ApiClient` class with `credentials: "include"` (cookie auth), always prepends `/api/v1`. Use `apiURL()` (HTTP) and `wsURL()` (WebSocket) from `config/api.config.ts`. Never derive WS URL from HTTP URL with string replacement.
- **Layout:** `config/layout.config.ts` drives panel position and ratio. Components read from layout config — never hardcode `left`/`right`.
- **Path alias:** `@/*` → `frontend/*` (tsconfig.json).
- **Feature flags:** `config/features.config.ts` — only `ENABLE_AI_ANALYSIS` and `ENABLE_AI_CHAT` are true. Teacher, e-book, analytics are out of scope.

## Non-obvious constraints

- **Persistent bash only** — attach to a long-running `docker exec` process. Never `docker exec` per-command; shell state (cd, env vars, pwd) must persist across commands.
- **JWT HttpOnly cookie only** — no localStorage, no Authorization header, no query-param tokens in WebSocket.
- **AI is asynchronous** — terminal commands publish to the event bus and return immediately; AI analysis runs separately and arrives over WebSocket when ready. Blocking the terminal for AI results is a spec violation.
- **Student container spec:** Ubuntu 24.04, non-root `student` user with passwordless sudo, resource-limited (2GB mem, 1 CPU, 100 PIDs, `no-new-privileges`, dropped capabilities except CHOWN/DAC_OVERRIDE/SETUID/SETGID). Image tag: `linux-student:latest`.
- **AI provider:** DeepSeek API (`https://api.deepseek.com`), model `deepseek-v4-pro`, temperature 0.3, max_tokens 1024.
- **DB credentials** are hardcoded in docker-compose and `.env.example`: user `lluser`, password `llpass`, database `ll_db`.
- **Docker socket fallback:** the terminal service auto-detects Colima socket (`~/.colima/default/docker.sock`) on macOS if `DOCKER_HOST` is unset.

## Source-of-truth docs

Specs live at `/root/docs/` (four Chinese markdown files by Dai Zelin and Lai Pengxu). The project's `docs/` directory contains derived engineering artifacts (architecture, DB schema, OpenAPI) generated from those specs. Also see `AGENTS.md` for co-development context and `DEPLOYMENT.md` for deployment guides.
