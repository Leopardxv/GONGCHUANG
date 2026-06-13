import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.model import User
from app.modules.task.model import Task, Submission


async def seed_tasks(db: AsyncSession):
    # Check if tasks table is empty
    tasks_query = await db.execute(select(Task))
    existing_tasks = tasks_query.scalars().all()
    if existing_tasks:
        print("Tasks table is not empty, skipping seed.")
        return

    print("Seeding tasks and submissions...")

    # Create mock tasks
    t1 = Task(
        title="Shell 脚本编写作业",
        description="请编写一个 Shell 脚本，实现批量重命名文件的功能。\n要求：\n1. 支持递归遍历子目录\n2. 支持按扩展名过滤\n3. 添加日志输出",
        deadline="2026-07-01",
    )
    t2 = Task(
        title="进程管理实验报告",
        description="使用 ps、top、kill 等命令观察和管理系统进程，撰写并提交实验报告。",
        deadline="2026-07-05",
    )
    db.add(t1)
    db.add(t2)
    await db.commit()
    await db.refresh(t1)
    await db.refresh(t2)

    # Fetch all students from DB
    students_query = await db.execute(select(User).where(User.role == "student"))
    students = students_query.scalars().all()

    # Predefined content matching TasksGrading.tsx mock submissions
    t1_contents = {
        "test": (
            "#!/bin/bash\n# Batch rename script\nfor file in *.txt; do\n  mv \"$file\" \"${file%.txt}.md\"\ndone\necho \"Done\"",
            92,
            "基本功能实现，但缺少递归和日志。",
        ),
        "testuser1": (
            "#!/bin/bash\nfind . -name \"*.txt\" | while read f; do\n  mv \"$f\" \"${f%.txt}.md\"\ndone",
            None,
            "",
        ),
        "testuser": (
            "#!/bin/bash\n# Advanced renamer\nlog() { echo \"[$(date +%T)] $1\" >> rename.log; }\nrename_recursive() {\n  local dir=$1\n  log \"Scanning $dir\"\n  for file in \"$dir\"/*.txt; do\n    [ -f \"$file\" ] || continue\n    mv \"$file\" \"${file%.txt}.md\"\n    log \"Renamed: $file\"\n  done\n}\nrename_recursive .",
            None,
            "",
        ),
    }

    t2_contents = {
        "test": (
            "实验报告：进程管理\n\n1. 使用 ps aux 查看所有进程\n2. 使用 top 实时监控\n3. 使用 kill -9 强制终止进程\n\n结论：掌握了基本的进程查看和管理命令。",
            85,
            "内容完整，可以适当增加截图。",
        )
    }

    # Add mock submissions for existing students
    for s in students:
        # Submissions for Task 1
        if s.username in t1_contents:
            content, score, comment = t1_contents[s.username]
            sub = Submission(
                task_id=t1.id,
                student_id=s.id,
                student_name=s.username,
                content=content,
                score=score,
                comment=comment if comment else None,
            )
            db.add(sub)

        # Submissions for Task 2
        if s.username in t2_contents:
            content, score, comment = t2_contents[s.username]
            sub = Submission(
                task_id=t2.id,
                student_id=s.id,
                student_name=s.username,
                content=content,
                score=score,
                comment=comment if comment else None,
            )
            db.add(sub)

    await db.commit()
    print("Database seeding completed successfully.")
