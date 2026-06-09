# Phase 1 数据库设计

## 1. ER 关系（Phase 1）

```
users 1 ──── 1 docker_instances
  │
  ├── 1 ──── * terminal_logs
  └── 1 ──── * ai_analysis_logs
```

## 2. DDL（PostgreSQL）

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════
-- users
-- ═══════════════════════════════════════════════════
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(64)  NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role          VARCHAR(16)  NOT NULL CHECK (role IN ('student', 'teacher')),
    class_id      UUID,
    status        VARCHAR(16)  NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_username ON users (username);
CREATE        INDEX idx_users_role     ON users (role);
CREATE        INDEX idx_users_class    ON users (class_id);

-- ═══════════════════════════════════════════════════
-- docker_instances
-- ═══════════════════════════════════════════════════
CREATE TABLE docker_instances (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    container_id    VARCHAR(128) NOT NULL,
    container_name  VARCHAR(128) NOT NULL,
    status          VARCHAR(16)  NOT NULL DEFAULT 'stopped'
                                 CHECK (status IN ('running', 'stopped', 'error')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docker_instances_user      ON docker_instances (user_id);
CREATE INDEX idx_docker_instances_container ON docker_instances (container_id);
CREATE INDEX idx_docker_instances_status    ON docker_instances (status);

-- ═══════════════════════════════════════════════════
-- terminal_logs
-- ═══════════════════════════════════════════════════
CREATE TABLE terminal_logs (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID         NOT NULL,
    command    TEXT         NOT NULL,
    stdout     TEXT         NOT NULL DEFAULT '',
    stderr     TEXT         NOT NULL DEFAULT '',
    exit_code  INTEGER,
    cwd        VARCHAR(512) NOT NULL DEFAULT '/home/student',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_terminal_logs_user    ON terminal_logs (user_id);
CREATE INDEX idx_terminal_logs_session ON terminal_logs (session_id);
CREATE INDEX idx_terminal_logs_time    ON terminal_logs (created_at);

-- ═══════════════════════════════════════════════════
-- ai_analysis_logs
-- ═══════════════════════════════════════════════════
CREATE TABLE ai_analysis_logs (
    id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    command                TEXT         NOT NULL,
    stdout                 TEXT         NOT NULL DEFAULT '',
    stderr                 TEXT         NOT NULL DEFAULT '',
    exit_code              INTEGER,
    command_explanation    TEXT,
    syntax_fix             TEXT,
    error_reason           TEXT,
    best_practice          TEXT,
    learning_recommendation TEXT,
    related_section_id     VARCHAR(128),
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_analysis_logs_user ON ai_analysis_logs (user_id);
CREATE INDEX idx_ai_analysis_logs_time ON ai_analysis_logs (created_at);
```

## 3. SQLAlchemy Models

```python
# backend/app/models/base.py
from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


# backend/app/modules/auth/model.py
class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    username      = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role          = Column(String(16), nullable=False, index=True)
    class_id      = Column(UUID(as_uuid=True), nullable=True)
    status        = Column(String(16), nullable=False, default="active")
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('student', 'teacher')", name="ck_users_role"),
        CheckConstraint("status IN ('active', 'inactive')", name="ck_users_status"),
    )

    # relationships
    docker_instance = relationship("DockerInstance", back_populates="user", uselist=False)
    terminal_logs   = relationship("TerminalLog", back_populates="user")
    ai_analysis_logs = relationship("AIAnalysisLog", back_populates="user")


# backend/app/modules/terminal/model.py
class DockerInstance(Base):
    __tablename__ = "docker_instances"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                            unique=True, nullable=False, index=True)
    container_id   = Column(String(128), nullable=False)
    container_name = Column(String(128), nullable=False)
    status         = Column(String(16), nullable=False, default="stopped")
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_active_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("status IN ('running', 'stopped', 'error')", name="ck_docker_status"),
    )

    user = relationship("User", back_populates="docker_instance")


class TerminalLog(Base):
    __tablename__ = "terminal_logs"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    command    = Column(Text, nullable=False)
    stdout     = Column(Text, nullable=False, default="")
    stderr     = Column(Text, nullable=False, default="")
    exit_code  = Column(Integer, nullable=True)
    cwd        = Column(String(512), nullable=False, default="/home/student")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="terminal_logs")


# backend/app/modules/ai/model.py
class AIAnalysisLog(Base):
    __tablename__ = "ai_analysis_logs"

    id                      = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id                 = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                                     nullable=False, index=True)
    command                 = Column(Text, nullable=False)
    stdout                  = Column(Text, nullable=False, default="")
    stderr                  = Column(Text, nullable=False, default="")
    exit_code               = Column(Integer, nullable=True)
    command_explanation     = Column(Text, nullable=True)
    syntax_fix              = Column(Text, nullable=True)
    error_reason            = Column(Text, nullable=True)
    best_practice           = Column(Text, nullable=True)
    learning_recommendation = Column(Text, nullable=True)
    related_section_id      = Column(String(128), nullable=True)
    created_at              = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="ai_analysis_logs")
```

## 4. Phase 1 vs 后续 Phase 表规划

| 表 | Phase 1 | 说明 |
|----|---------|------|
| `users` | ✅ 完整 | — |
| `docker_instances` | ✅ 完整 | — |
| `terminal_logs` | ✅ 完整 | — |
| `ai_analysis_logs` | ✅ 完整 | Phase 1 专用（命令分析） |
| `ai_chat_logs` | ❌ Phase 2 | AI 对话历史 |
| `study_sessions` | ❌ Phase 3 | 学习时长统计 |
| `ebook_chapters` | ❌ Phase 2 | 教材章节 |
| `assignments` | ❌ Phase 4 | 作业 |
| `submissions` | ❌ Phase 4 | 提交记录 |

## 5. 索引策略说明

- `idx_users_username` — 登录查询（高频）
- `idx_users_role` — 教师端按角色筛选
- `idx_docker_instances_user` — 登录时按 user_id 查容器（高频）
- `idx_docker_instances_container` — 按 container_id 查状态
- `idx_terminal_logs_user` + `idx_terminal_logs_time` — 学习分析按用户+时间查询
- `idx_ai_analysis_logs_user` + `idx_ai_analysis_logs_time` — 分析历史查询

## 6. 迁移工具

使用 Alembic 管理数据库迁移，初始化命令：

```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "phase1_initial"
alembic upgrade head
```
