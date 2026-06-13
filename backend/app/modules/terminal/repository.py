import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.terminal.model import DockerInstance, TerminalLog


class DockerInstanceRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_user_id(self, user_id: uuid.UUID) -> DockerInstance | None:
        result = await self.db.execute(
            select(DockerInstance).where(DockerInstance.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self, user_id: uuid.UUID, container_id: str, container_name: str
    ) -> DockerInstance:
        stmt = (
            pg_insert(DockerInstance)
            .values(
                user_id=user_id,
                container_id=container_id,
                container_name=container_name,
                status="running",
            )
            .on_conflict_do_update(
                index_elements=["user_id"],
                set_={
                    "container_id": container_id,
                    "container_name": container_name,
                    "status": "running",
                    "last_active_at": datetime.now(timezone.utc),
                },
            )
            .returning(DockerInstance)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.scalar_one()

    async def update_status(self, instance_id: uuid.UUID, status: str) -> None:
        await self.db.execute(
            update(DockerInstance)
            .where(DockerInstance.id == instance_id)
            .values(status=status, last_active_at=datetime.now(timezone.utc))
        )
        await self.db.commit()

    async def delete(self, instance_id: uuid.UUID) -> None:
        from sqlalchemy import delete as sa_delete

        await self.db.execute(
            sa_delete(DockerInstance).where(DockerInstance.id == instance_id)
        )
        await self.db.commit()

    async def update_last_active(self, instance_id: uuid.UUID) -> None:
        await self.db.execute(
            update(DockerInstance)
            .where(DockerInstance.id == instance_id)
            .values(last_active_at=datetime.now(timezone.utc))
        )
        await self.db.commit()


class TerminalLogRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        command: str,
        stdout: str = "",
        stderr: str = "",
        exit_code: int | None = None,
        cwd: str = "/home/student",
    ) -> TerminalLog:
        log = TerminalLog(
            user_id=user_id,
            session_id=session_id,
            command=command,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            cwd=cwd,
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        return log
