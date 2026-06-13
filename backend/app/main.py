from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.events.ai_subscriber import register_ai_subscriber
from app.modules.auth.router import router as auth_router
from app.modules.ai.router import router as ai_router
from app.modules.terminal.router import router as terminal_router
from app.modules.task.router import router as task_router

# Register AI subscriber eagerly (before first request)
register_ai_subscriber()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # ── Database Initialization on Startup ──
    from app.database import engine, async_session
    from app.models.base import Base
    
    # Import all models to ensure SQLAlchemy metadata registers them
    from app.modules.auth.model import User
    from app.modules.terminal.model import DockerInstance, TerminalLog
    from app.modules.ai.model import AIAnalysisLog
    from app.modules.task.model import Task, Submission
    from app.modules.task.seed import seed_tasks

    print("Initializing database tables...")
    async with engine.begin() as conn:
        from sqlalchemy import text
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS textbook_progress INTEGER DEFAULT 0;"))
    print("Database tables initialized.")

    # Seed mock data
    async with async_session() as session:
        await seed_tasks(session)
        
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(terminal_router, prefix=settings.API_V1_PREFIX + "/terminal")
app.include_router(task_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok"}
