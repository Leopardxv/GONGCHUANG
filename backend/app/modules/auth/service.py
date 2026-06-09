import uuid
from datetime import datetime, timezone

import bcrypt
from fastapi import HTTPException
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.modules.auth.model import User
from app.modules.auth.repository import UserRepository
from app.modules.auth.schema import LoginRequest, RegisterRequest, UserStatsResponse


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now.timestamp() + settings.JWT_EXPIRE_SECONDS,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    async def register(self, req: RegisterRequest) -> User:
        existing = await self.repo.get_by_username(req.username)
        if existing:
            raise HTTPException(status_code=409, detail="Username already exists")
        return await self.repo.create(
            username=req.username,
            password_hash=hash_password(req.password),
            role=req.role,
        )

    async def login(self, req: LoginRequest) -> User:
        user = await self.repo.get_by_username(req.username)
        if not user or not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        if user.status != "active":
            raise HTTPException(status_code=403, detail="Account is inactive")
        return user

    async def get_me(self, user_id: str) -> User:
        user = await self.repo.get_by_id(uuid.UUID(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    async def get_stats(self, user_id: str) -> UserStatsResponse:
        from sqlalchemy import func, text, select

        from app.modules.terminal.model import TerminalLog
        from app.modules.ai.model import AIAnalysisLog

        uid = uuid.UUID(user_id)

        # Today's terminal commands + time span
        today_result = await self.db.execute(
            select(
                func.count(TerminalLog.id),
                func.min(TerminalLog.created_at),
                func.max(TerminalLog.created_at),
            ).where(
                TerminalLog.user_id == uid,
                TerminalLog.created_at >= func.current_date(),
            )
        )
        cmd_count, first_ts, last_ts = today_result.one()

        duration_minutes = 0
        if cmd_count and cmd_count > 0 and first_ts and last_ts:
            delta = last_ts - first_ts
            duration_minutes = max(1, int(delta.total_seconds() / 60))

        # Total AI analyses
        analysis_result = await self.db.execute(
            select(func.count(AIAnalysisLog.id)).where(
                AIAnalysisLog.user_id == uid
            )
        )
        total_analyses = analysis_result.scalar() or 0

        return UserStatsResponse(
            today_duration_minutes=duration_minutes,
            today_commands=cmd_count or 0,
            total_analyses=total_analyses,
            textbook_progress=0,
        )
