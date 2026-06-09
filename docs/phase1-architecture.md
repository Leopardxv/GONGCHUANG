# Phase 1 架构设计与项目骨架

## 1. 整体分层

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js 15 App Router)                   │
│                                                     │
│  app/                  config/        stores/       │
│  ├── (auth)/           ├── layout     ├── authStore │
│  ├── (student)/        ├── features   ├── terminal  │
│  └── layout.tsx        └── api        └── ai        │
│                                                     │
│  components/           hooks/          services/     │
│  ├── TerminalPanel     ├── useTerminal ├── api.ts    │
│  ├── AIAnalysisPanel   ├── useAI      ├── auth      │
│  └── common/           └── useAuth    ├── terminal   │
│                                         └── ai       │
├─────────────────────────────────────────────────────┤
│                     HTTP / WebSocket                 │
├─────────────────────────────────────────────────────┤
│  Backend (FastAPI)                                  │
│                                                     │
│  app/main.py          modules/         prompts/     │
│  app/config.py        ├── auth/        ├── command_ │
│  app/database.py      ├── terminal/         analysis │
│  app/dependencies.py  ├── ai/          └── linux_   │
│  app/events/          └── ...               teacher │
│                                                     │
├─────────────────────────────────────────────────────┤
│  PostgreSQL  │  Docker Daemon  │  DeepSeek API       │
└─────────────────────────────────────────────────────┘
```

## 2. 组件树（Phase 1 运行时）

```
<AuthLayout>                            # /login, /register
  <LoginForm />
  └── 或 ──
  <RegisterForm />

<StudentLayout>                         # /playground
  ├── <TerminalPanel />          # 左/上（可配置）
  └── <AIAnalysisPanel />        # 右/下（可配置）

# 布局由 layout.config.ts 驱动：
# terminalPosition: "left" | "right" | "top" | "bottom"
# panelRatio: 0.6  (terminal 占比 60%)
```

## 3. 目录结构（完整骨架）

```
linux-learning-system/
│
├── frontend/                          # Next.js 15 + App Router
│   ├── app/
│   │   ├── layout.tsx                 # 根 layout（html, body, Provider tree）
│   │   ├── globals.css                # Tailwind 入口
│   │   ├── (auth)/
│   │   │   ├── layout.tsx             # AuthLayout（居中卡片式）
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   └── (student)/
│   │       ├── layout.tsx             # StudentLayout（可配置面板排列）
│   │       ├── playground/
│   │       │   └── page.tsx           # Phase 1 核心页面
│   │       └── dashboard/
│   │           └── page.tsx           # 学生首页（简要状态）
│   │
│   ├── components/
│   │   ├── TerminalPanel/
│   │   │   ├── index.tsx             # xterm.js + WebSocket
│   │   │   └── TerminalPanel.module.css
│   │   ├── AIAnalysisPanel/
│   │   │   ├── index.tsx             # AI 分析结果展示
│   │   │   └── AIAnalysisPanel.module.css
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       └── Spinner.tsx
│   │
│   ├── config/
│   │   ├── layout.config.ts          # 布局配置（terminal/ai 位置、比例）
│   │   ├── features.config.ts        # Feature flags（ENABLE_AI 等）
│   │   └── api.config.ts             # API base URL, WS URL
│   │
│   ├── hooks/
│   │   ├── useTerminal.ts            # WS 连接、命令发送、输出接收
│   │   ├── useAI.ts                  # AI 分析请求
│   │   └── useAuth.ts               # 登录状态、redirect
│   │
│   ├── services/
│   │   ├── api.ts                    # fetch 封装（base URL, credentials, error handler）
│   │   ├── auth.service.ts           # register(), login(), logout(), getMe()
│   │   ├── terminal.service.ts       # createWSConnection()
│   │   └── ai.service.ts            # analyzeCommand()
│   │
│   ├── stores/
│   │   ├── authStore.ts              # user, isAuthenticated, login, logout
│   │   ├── terminalStore.ts          # connectionStatus, sessionId
│   │   ├── layoutStore.ts            # currentLayout（从 config 读取）
│   │   └── aiStore.ts               # analysisHistory[], latestAnalysis
│   │
│   ├── types/
│   │   ├── user.ts
│   │   ├── terminal.ts
│   │   ├── ai.ts
│   │   └── api.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   └── next.config.ts
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI 入口，CORS, lifespan, 路由注册
│   │   ├── config.py                  # Pydantic Settings（DB URL, Docker, AI, JWT）
│   │   ├── database.py                # SQLAlchemy async engine + session factory
│   │   ├── dependencies.py            # get_db, get_current_user（Cookie JWT 提取）
│   │   ├── events/
│   │   │   ├── __init__.py
│   │   │   └── event_bus.py           # 轻量 asyncio pubsub
│   │   └── models/
│   │       ├── __init__.py
│   │       └── base.py                # DeclarativeBase
│   │
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # /auth/register, /auth/login, /auth/logout, /auth/me
│   │   │   ├── service.py             # 注册逻辑、密码哈希、JWT 签发/验证
│   │   │   ├── repository.py          # User CRUD
│   │   │   ├── schema.py              # Pydantic request/response
│   │   │   └── model.py               # User ORM
│   │   ├── terminal/
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # WS /terminal/connect
│   │   │   ├── service.py             # Docker container 生命周期 + exec session 管理
│   │   │   ├── repository.py          # TerminalLog + DockerInstance CRUD
│   │   │   ├── schema.py              # WS 消息类型、Pydantic 模型
│   │   │   └── model.py               # DockerInstance, TerminalLog ORM
│   │   └── ai/
│   │       ├── __init__.py
│   │       ├── router.py              # POST /ai/analyze-command
│   │       ├── service.py             # DeepSeek API 调用、prompt 构建、JSON 解析
│   │       ├── repository.py          # AIAnalysisLog CRUD
│   │       ├── schema.py              # Pydantic request/response
│   │       └── model.py               # AIAnalysisLog ORM
│   │
│   ├── prompts/
│   │   ├── command_analysis.prompt    # 命令分析 Prompt 模板（带 JSON schema 约束）
│   │   └── linux_teacher.prompt       # Linux 教师人设 Prompt（Phase 2 用）
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth.py                    # Cookie JWT 验证中间件（HTTP + WS 共用）
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_terminal.py
│   │   └── test_ai.py
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── Dockerfile
│   └── pyproject.toml
│
├── docker/
│   ├── student-image/
│   │   ├── Dockerfile                  # Ubuntu 24.04 + 预装工具 + student 用户
│   │   └── init.sh                     # 可选：首次启动初始化
│   └── docker-compose.yml             # 开发环境：backend + db + redis + docker-in-docker
│
├── scripts/
│   ├── build_student_image.sh
│   └── seed_test_users.py
│
├── docs/
│   ├── phase1-openapi.yaml
│   ├── phase1-database.md
│   └── phase1-architecture.md         # 本文件
│
├── .gitignore
└── README.md
```

## 4. 关键架构决策

### 4.1 Persistent Shell Session

```
Client (xterm.js)                  Backend                         Docker
      │                               │                               │
      ├── WS connect ────────────────►│                               │
      │  (cookie auth)                ├── ensure container running ──►│
      │                               │◄── container_id ─────────────┤
      │                               │                               │
      │                               ├── docker exec -it bash ──────►│
      │                               │   (tty=True, stdin=True)      │
      │                               │◄── exec_id ──────────────────┤
      │                               │                               │
      │◄── {type:"session"} ─────────┤                               │
      │                               │                               │
      ├── {type:"input","a"} ────────►│── "a" ───────────────────────►│
      │◄── {type:"output","a"} ──────┤◄── "a" ───────────────────────┤
      │                               │                               │
      ├── {type:"command","ls -la"} ─►│                               │
      │                               ├── log → terminal_logs         │
      │                               ├── emit "cmd_executed" ──┐    │
      │                               │                          │    │
      │◄── {type:"output","..."} ────┤◄── PTY stdout ───────────┤    │
      │                               │                          │    │
      │                               │    ┌─────────────────────┘    │
      │                               │    ▼ (async, non-blocking)     │
      │                               │  AI service                    │
      │                               │  ├── build prompt              │
      │                               │  ├── call DeepSeek API         │
      │                               │  ├── store → ai_analysis_logs  │
      │                               │  └── WS push result ◄──────────┤
      │                               │                               │
      │◄── {type:"ai_analysis",...} ──┤                               │
```

关键点：
- 终端 I/O 与 AI 分析完全解耦
- AI 分析不阻塞终端输出
- 一条 WS 连接承载：终端 I/O + 命令事件 + AI 结果推送

### 4.2 配置化布局

```typescript
// frontend/config/layout.config.ts
export const studentLayoutConfig = {
  playground: {
    panels: [
      { id: "terminal", component: "TerminalPanel", position: "left", ratio: 0.6 },
      { id: "aiAnalysis", component: "AIAnalysisPanel", position: "right", ratio: 0.4 },
    ],
    direction: "horizontal", // "horizontal" | "vertical"
  },
} as const;

// 修改布局只需改 config，不改组件代码
// tomorrow: 把 terminal 放顶部 → direction: "vertical", position: "top"
```

### 4.3 Feature Flags

```typescript
// frontend/config/features.config.ts
export const features = {
  ENABLE_AI_ANALYSIS: true,    // AI 命令分析开关（Phase 1 核心）
  ENABLE_AI_CHAT: false,       // AI 对话（Phase 2）
  ENABLE_EBOOK: false,         // 教材系统（Phase 2）
  ENABLE_ANALYTICS: false,     // 学习分析（Phase 3）
  ENABLE_TEACHER: false,       // 教师后台（Phase 3）
  ENABLE_ASSIGNMENT: false,    // 作业系统（Phase 4）
} as const;
```

### 4.4 Event Bus（轻量 asyncio pubsub）

```python
# backend/app/events/event_bus.py
import asyncio
from collections import defaultdict
from typing import Any, Awaitable, Callable

Handler = Callable[[dict[str, Any]], Awaitable[None]]

class EventBus:
    """Lightweight in-memory pubsub for Phase 1."""

    def __init__(self) -> None:
        self._handlers: dict[str, list[Handler]] = defaultdict(list)

    def subscribe(self, event: str, handler: Handler) -> None:
        self._handlers[event].append(handler)

    async def publish(self, event: str, data: dict[str, Any]) -> None:
        handlers = self._handlers.get(event, [])
        if not handlers:
            return
        results = await asyncio.gather(
            *(handler(data) for handler in handlers),
            return_exceptions=True,
        )
        for result in results:
            if isinstance(result, Exception):
                import logging
                logging.getLogger(__name__).error(
                    "Event handler error", exc_info=result
                )

# 全局单例
event_bus = EventBus()
```

事件：
- `"command_executed"` — terminal service 发布，AI service 订阅
- `"container_ready"` — Docker service 发布，terminal service 订阅
- 更多事件在后续 Phase 添加

### 4.5 JWT Cookie 配置

```python
# 签发 cookie 参数
{
    "key": "access_token",
    "value": "<jwt_token>",
    "httponly": True,
    "secure": True,       # 生产环境必须 True（HTTPS）
    "samesite": "lax",
    "max_age": 86400,     # 24 小时
    "path": "/",
}
```

### 4.6 WebSocket 鉴权流程

```
Client                            Backend
  │                                  │
  ├── GET /terminal/connect ────────►│
  │   (浏览器自动带 Cookie)           │
  │                                  ├── 提取 Cookie 中的 access_token
  │                                  ├── 验证 JWT
  │                                  ├── 获取 user_id
  │                                  ├── 升级 101，带 user_id 进 WS scope
  │                                  │
  │◄── 101 Switching Protocols ─────┤
```

禁止做法：
- `ws://host/terminal/connect?token=xxx` ❌

### 4.7 Docker 学生镜像

```dockerfile
# docker/student-image/Dockerfile
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash coreutils git vim nano python3 gcc g++ make man-db tree \
    curl wget sudo ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash student \
    && echo "student ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/student \
    && chmod 0440 /etc/sudoers.d/student

USER student
WORKDIR /home/student
```

容器运行时参数：
```
--memory=2g
--cpus=1
--pids-limit=100
--security-opt=no-new-privileges
--cap-drop=ALL
--cap-add=CHOWN --cap-add=DAC_OVERRIDE --cap-add=SETUID --cap-add=SETGID
--network=none (或 restricted bridge)
--read-only=false (home + tmp 需要可写)
-v <volume>:/home/student
```

## 5. Phase 1 实现顺序

```
Step 1: 项目骨架搭建
  ├── frontend/ init (create-next-app, tailwind, zustand, xterm)
  ├── backend/ init (FastAPI, SQLAlchemy, alembic)
  └── docker/student-image/ Dockerfile

Step 2: Auth 模块
  ├── backend: User model, auth router, JWT service, Cookie middleware
  └── frontend: login/register pages, authStore, authService

Step 3: Docker + Terminal 模块
  ├── backend: DockerInstance model, container lifecycle service,
  │            WS /terminal/connect, persistent exec session
  └── frontend: TerminalPanel (xterm.js), useTerminal hook,
                terminalStore, playground page

Step 4: AI 命令分析模块
  ├── backend: AIAnalysisLog model, DeepSeek service,
  │            command_analysis.prompt, event_bus subscriber
  └── frontend: AIAnalysisPanel, useAI hook, aiStore

Step 5: 联调 + 闭环验证
  └── 登录 → playground → 终端输入 → AI 分析 → 面板展示
```
