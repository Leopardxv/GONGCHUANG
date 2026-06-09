import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.model import AIAnalysisLog


class AIAnalysisRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        command: str,
        stdout: str = "",
        stderr: str = "",
        exit_code: int | None = None,
        command_explanation: str | None = None,
        syntax_fix: str | None = None,
        error_reason: str | None = None,
        best_practice: str | None = None,
        learning_recommendation: str | None = None,
        related_section_id: str | None = None,
    ) -> AIAnalysisLog:
        log = AIAnalysisLog(
            user_id=user_id,
            command=command,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            command_explanation=command_explanation,
            syntax_fix=syntax_fix,
            error_reason=error_reason,
            best_practice=best_practice,
            learning_recommendation=learning_recommendation,
            related_section_id=related_section_id,
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        return log

    async def get_by_id(self, log_id: uuid.UUID) -> AIAnalysisLog | None:
        result = await self.db.execute(
            select(AIAnalysisLog).where(AIAnalysisLog.id == log_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: uuid.UUID, limit: int = 20) -> list[AIAnalysisLog]:
        result = await self.db.execute(
            select(AIAnalysisLog)
            .where(AIAnalysisLog.user_id == user_id)
            .order_by(AIAnalysisLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
