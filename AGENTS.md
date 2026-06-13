# AGENTS.md — Linux Learning System

## Fast commands (Windows)

```powershell
# Start infrastructure (from project root)
docker compose -f docker/docker-compose.yml up -d

# Backend (Python 3.12, venv at backend/.venv)
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
# Health: GET /health, API prefix: /api/v1

# Frontend (Next.js 15 App Router)
cd frontend
npm run dev
# Runs on :3000, fetches to :8000 in JS

# Build student Docker image (one-time)
docker build -t linux-student:latest docker/student-image/

# DB table creation (one-time, from backend dir with venv active)
python -c "import asyncio; from app.database import engine; from app.models.base import Base; from app.modules.auth.model import User; from app.modules.terminal.model import DockerInstance,TerminalLog; from app.modules.ai.model import AIAnalysisLog; async def init(): async with engine.begin() as c: await c.run_sync(Base.metadata.create_all); asyncio.run(init())"
```

**Lint/Typecheck:** `npm run lint` is broken (interactive ESLint prompt). Use `npx tsc --noEmit` for frontend. Backend: `ruff check .` in `backend/`.

## Architecture

```
backend/           FastAPI app (package: app/)
  app/config.py              All settings via LL_* env vars (pydantic-settings)
  app/database.py            Async SQLAlchemy session (asyncpg)
  app/dependencies.py        get_db() + get_current_user() via JWT Cookie
  app/middleware/auth.py     ws_auth() reads "access_token" cookie from WS handshake
  app/events/event_bus.py    Lightweight asyncio pubsub
  app/modules/
    auth/                    JWT Cookie auth (register, login, logout, /me, /stats)
    terminal/                Docker container mgmt + WebSocket terminal gateway
      repository.py          Uses upsert() (ON CONFLICT), NOT plain INSERT
      service.py             Container lookup by name, not DB-stored container_id
      router.py              WS endpoint /api/v1/terminal/connect
    ai/                      DeepSeek AI analysis + textbook search

frontend/          Next.js 15 App Router, Tailwind v4, Zustand 5, xterm.js 5.5
  app/                       page.tsx (landing), (auth)/, (student)/playground, textbook/
  components/TerminalPanel/  xterm.js terminal + WebSocket hook
  hooks/useTerminal.ts       WebSocket connect, heartbeat, output/input forwarding
  stores/                    zustand: authStore, terminalStore, aiStore, exerciseStore
  config/api.config.ts       wsURL() for WS, apiURL() for REST — always use wsURL() for WS
  data/                      exercises.ts, textbook-snippets.ts

docker/             docker-compose.yml (PG16+Redis7+ll-student-net), student-image/
```

**Config authority:** `backend/app/config.py` — all env vars prefixed `LL_`. `.env` lives at `backend/.env`.

**DB credentials:** `lluser` / `llpass` / `ll_db` (hardcoded in docker-compose and .env).

## Critical gotchas

### Docker container management
- **Look up containers by deterministic NAME** (`ll-student-{user_id[:12]}`), never by DB-stored `container_id`. Stale IDs from Docker restarts cause 404 errors.
- **Use `upsert()` (INSERT ... ON CONFLICT DO UPDATE)** in repository, never plain `INSERT`. Duplicate user_id causes IntegrityError.
- **`ll-student-net`** network is auto-created by `_ensure_network()` in `service.py` AND defined in `docker-compose.yml`.
- If container is created but DB insert fails, the container is force-removed (cleanup in `_create_container`).

### Terminal output rendering
- **Do NOT gate `onOutput` on `readyRef.current`.** Docker output can arrive before the `session` WebSocket message, causing a race condition. `onError` never had this gate — keep `onOutput` consistent.
- The `readyRef` init was moved to `onSessionReady` callback (fired on session message receipt), but the simplest fix is to just remove the guard from `onOutput`.

### Backend reload
- **`uvicorn --reload` may use stale `__pycache__`.** If changes don't take effect: kill all Python processes, run `Get-ChildItem -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force` from backend/, then restart.

### Textbook PDF navigation
- **iframe `src` hash-only changes don't reload.** Use `key={pdfPage}` on the iframe to force React to remount it when navigating pages.

### Frontend
- **Path alias:** `@/*` maps to `frontend/*`
- **API client:** `ApiClient` uses `credentials: "include"` for cookie auth, prepends `/api/v1`
- **WS helper:** Use `wsURL(path)` from `config/api.config.ts`, NOT `apiURL().replace("http", "ws")`
- **Tailwind v4:** uses `@tailwindcss/postcss` plugin (not the v3 config file approach)
- **`useSearchParams()`** in playground page is a client component — works without Suspense in Next.js 15

### Backend
- **Auth is JWT HttpOnly Cookie only** — `Set-Cookie: access_token=...; HttpOnly; SameSite=Lax; Path=/`. No localStorage. No query token in WS.
- **WS auth via cookie** — `middleware/auth.py:ws_auth()` reads `access_token` cookie from WS handshake.
- **Terminal uses persistent bash session** — attach to long-running `docker exec`, never `docker exec` per command.
- **AI analysis is async** — terminal output arrives first; AI processes in parallel via event bus.
- **AI provider:** DeepSeek API at `https://api.deepseek.com`, model `deepseek-chat` (as set in `.env`).
- **Student container:** Ubuntu 24.04, non-root `student` user, passwordless sudo, 2GB mem, 1 CPU, 100 PIDs. Image: `linux-student:latest`.

## Layout conventions

- TerminalPanel has two variants: `default` (macOS-style) and `vscode` (VS Code tab style). Playground uses `vscode`.
- `config/layout.config.ts` drives panel position/ratio. Don't hardcode `left/right` in components.

## What's implemented (all of Phase 1)

Auth (register/login/logout/JWT cookie), Docker session manager + persistent bash, WebSocket terminal + xterm.js, AI command analysis + event bus + CoachPanel, Playground/Textbook integration.

## Project state

- **No git repo** — `.gitignore` exists but not initialized.
- **No test commands** wired yet. Playwright and ruff are installed.
- **DB tables require manual creation** — no auto-migration on startup. Use the Python snippet above or alembic.
