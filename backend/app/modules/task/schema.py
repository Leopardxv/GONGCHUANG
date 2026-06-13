import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., max_length=128)
    description: str
    deadline: str = Field(..., max_length=16) # e.g. YYYY-MM-DD


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    deadline: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubmissionCreate(BaseModel):
    content: str


class SubmissionGrade(BaseModel):
    student_id: uuid.UUID
    score: int = Field(..., ge=0, le=100)
    comment: str = ""


class SubmissionResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    content: str
    score: int | None = None
    comment: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskWithSubmissionsResponse(TaskResponse):
    submissions: list[SubmissionResponse] = []


class TaskWithMySubmissionResponse(TaskResponse):
    submission: SubmissionResponse | None = None
