import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


# ── WS Client → Server messages ──

class WsInput(BaseModel):
    type: str = "input"
    data: str


class WsResize(BaseModel):
    type: str = "resize"
    cols: int
    rows: int


class WsCommand(BaseModel):
    type: str = "command"
    text: str
    cwd: str = "/home/student"


class WsPing(BaseModel):
    type: str = "ping"


# ── WS Server → Client messages ──

class WsOutput(BaseModel):
    type: str = "output"
    data: str


class WsSession(BaseModel):
    type: str = "session"
    status: str
    container_id: str
    user: str


class WsError(BaseModel):
    type: str = "error"
    message: str


class WsPong(BaseModel):
    type: str = "pong"


class WsAIAnalysis(BaseModel):
    type: str = "ai_analysis"
    analysis: dict[str, Any]


# ── Terminal log ──

class TerminalLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    session_id: uuid.UUID
    command: str
    stdout: str
    stderr: str
    exit_code: int | None
    cwd: str
    created_at: datetime

    model_config = {"from_attributes": True}
