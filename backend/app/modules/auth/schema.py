import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="student", pattern=r"^(student|teacher)$")


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    role: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserStatsResponse(BaseModel):
    today_duration_minutes: int
    today_commands: int
    total_analyses: int
    textbook_progress: int
