import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.modules.auth.model import User
from app.modules.task.model import Task, Submission
from app.modules.task.schema import (
    TaskCreate,
    TaskResponse,
    TaskWithMySubmissionResponse,
    TaskWithSubmissionsResponse,
    SubmissionCreate,
    SubmissionGrade,
    SubmissionResponse,
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=list[Any])
async def list_tasks(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(user["id"])
    role = user["role"]

    # Fetch all tasks ordered by creation time
    tasks_query = await db.execute(select(Task).order_by(Task.created_at.desc()))
    tasks = tasks_query.scalars().all()

    result = []
    if role == "teacher":
        # For teachers, return all tasks, each with all submissions
        for task in tasks:
            subs_query = await db.execute(
                select(Submission)
                .where(Submission.task_id == task.id)
                .order_by(Submission.created_at.desc())
            )
            submissions = subs_query.scalars().all()
            
            task_dict = TaskResponse.model_validate(task).model_dump()
            task_dict["submissions"] = [
                SubmissionResponse.model_validate(s) for s in submissions
            ]
            result.append(task_dict)
    else:
        # For students, return all tasks, each with their own submission if any
        for task in tasks:
            sub_query = await db.execute(
                select(Submission)
                .where(Submission.task_id == task.id, Submission.student_id == user_id)
            )
            submission = sub_query.scalar_one_or_none()

            task_dict = TaskResponse.model_validate(task).model_dump()
            task_dict["submission"] = (
                SubmissionResponse.model_validate(submission) if submission else None
            )
            result.append(task_dict)

    return result


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    req: TaskCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create tasks.",
        )

    task = Task(
        title=req.title,
        description=req.description,
        deadline=req.deadline,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.post("/{task_id}/submit", response_model=SubmissionResponse)
async def submit_task(
    task_id: uuid.UUID,
    req: SubmissionCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit tasks.",
        )

    # Check if task exists
    task_query = await db.execute(select(Task).where(Task.id == task_id))
    task = task_query.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    student_id = uuid.UUID(user["id"])

    # Check if user exists to fetch student name
    student_query = await db.execute(select(User).where(User.id == student_id))
    student_user = student_query.scalar_one_or_none()
    if not student_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student user not found.",
        )

    # Check if already submitted
    sub_query = await db.execute(
        select(Submission).where(
            Submission.task_id == task_id, Submission.student_id == student_id
        )
    )
    submission = sub_query.scalar_one_or_none()

    if submission:
        # Update existing submission and reset grading status
        submission.content = req.content
        submission.score = None
        submission.comment = None
        submission.updated_at = datetime.now(timezone.utc)
    else:
        # Create new submission
        submission = Submission(
            task_id=task_id,
            student_id=student_id,
            student_name=student_user.username,
            content=req.content,
        )
        db.add(submission)

    await db.commit()
    await db.refresh(submission)
    return submission


@router.post("/{task_id}/grade", response_model=SubmissionResponse)
async def grade_submission(
    task_id: uuid.UUID,
    req: SubmissionGrade,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can grade submissions.",
        )

    # Find submission
    sub_query = await db.execute(
        select(Submission).where(
            Submission.task_id == task_id, Submission.student_id == req.student_id
        )
    )
    submission = sub_query.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found for this student and task.",
        )

    # Update score and comment
    submission.score = req.score
    submission.comment = req.comment
    submission.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(submission)
    return submission
