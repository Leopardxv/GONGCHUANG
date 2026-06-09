# Linux Learning System

AI-Enhanced Linux Online Learning Platform. Students practice Linux commands in a real terminal (Docker container) with AI-powered real-time analysis and learning guidance.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js 15)                              │
│  xterm.js Terminal  ↔  WebSocket  ↔  FastAPI        │
│  AI Learning Cards          REST API                │
├─────────────────────────────────────────────────────┤
│  Backend (FastAPI)                                  │
│  Auth (JWT Cookie) · Terminal (Docker) · AI (DeepSeek) │
├─────────────────────────────────────────────────────┤
│  PostgreSQL  │  Docker Daemon  │  DeepSeek API       │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16
- DeepSeek API key ([platform.deepseek.com](https://platform.deepseek.com))

### 1. Clone & Setup Backend

```bash
git clone https://github.com/Leopardxv/GONGCHUANG.git
cd linux-learning-system/backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set LL_JWT_SECRET and LL_AI_API_KEY

# Start database
docker compose -f ../docker/docker-compose.yml up -d

# Create tables
python -c "
import asyncio
from app.database import engine
from app.models.base import Base
from app.modules.auth.model import User
from app.modules.terminal.model import DockerInstance, TerminalLog
from app.modules.ai.model import AIAnalysisLog
async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
asyncio.run(init())
"

# Start backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Build Student Docker Image

```bash
cd ..
docker network create ll-student-net
bash scripts/build_student_image.sh
```

### 4. Open Browser

- Home: `http://localhost:3000`
- Swagger: `http://localhost:8000/docs`

## Project Structure

```
linux-learning-system/
├── frontend/           # Next.js 15 App Router
│   ├── app/            # Pages & layouts
│   ├── components/     # TerminalPanel, AuthProvider
│   ├── hooks/          # useTerminal, useAuth
│   ├── services/       # API client, auth, terminal, AI
│   ├── stores/         # Zustand stores
│   └── config/         # API, layout, feature flags
├── backend/            # FastAPI
│   ├── app/            # Main app, config, DB, middleware
│   ├── modules/        # auth, terminal, ai
│   ├── prompts/        # AI prompt templates
│   └── tests/
├── docker/             # docker-compose, student Dockerfile
├── scripts/            # Build scripts
└── docs/               # Architecture & API docs
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login (JWT cookie) |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/auth/stats` | User learning stats |
| WS | `/api/v1/terminal/connect` | Terminal WebSocket |
| POST | `/api/v1/ai/analyze-command` | AI command analysis |
| POST | `/api/v1/ai/chat` | AI chat |
| GET | `/health` | Health check |

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description |
|----------|-------------|
| `LL_DATABASE_URL` | PostgreSQL connection string |
| `LL_JWT_SECRET` | Random secret for JWT signing |
| `LL_AI_API_KEY` | DeepSeek API key |
| `LL_CORS_ORIGINS` | Allowed CORS origins (JSON array) |
| `LL_DOCKER_IMAGE` | Student Docker image name (default: `linux-student:latest`) |

## License

MIT
