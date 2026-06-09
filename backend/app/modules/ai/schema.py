import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CommandAnalysisRequest(BaseModel):
    command: str
    stdout: str = ""
    stderr: str = ""
    exit_code: int | None = None
    cwd: str = "/home/student"
    context: list[str] = Field(default_factory=list, max_length=5)


class CommandAnalysisResponse(BaseModel):
    id: uuid.UUID
    command_explanation: str
    syntax_fix: str | None = None
    error_reason: str | None = None
    best_practice: str
    learning_recommendation: str
    related_section_id: str | None = None

    model_config = {"from_attributes": True}


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list, max_length=30)


class ChatResponse(BaseModel):
    reply: str
