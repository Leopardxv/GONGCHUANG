import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.modules.ai.schema import ChatRequest, ChatResponse, CommandAnalysisRequest, CommandAnalysisResponse
from app.modules.ai.service import AIService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/analyze-command", response_model=CommandAnalysisResponse)
async def analyze_command(
    req: CommandAnalysisRequest,
    request: Request,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a terminal command. Called by the frontend or via event bus."""
    svc = AIService(db)
    return await svc.analyze_and_store(
        user_id=user["id"],
        command=req.command,
        stdout=req.stdout,
        stderr=req.stderr,
        exit_code=req.exit_code,
        cwd=req.cwd,
        context=req.context,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    user: dict = Depends(get_current_user),
):
    svc = AIService(None)
    return await svc.chat(req)
