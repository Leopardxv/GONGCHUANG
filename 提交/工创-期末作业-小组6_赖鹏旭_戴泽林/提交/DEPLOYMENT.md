#  GONGCHUANG 部署指南

本文档说明项目的环境要求、本地开发步骤和部署方式。

---

##  系统要求

### 最低配置
- **CPU**: 2 核心
- **内存**: 4GB RAM
- **存储**: 20GB（含 Docker 镜像）
- **操作系统**: Linux (推荐 Ubuntu 20.04+) / macOS / Windows (WSL2)

### 软件依赖

| 组件 | 版本要求 | 说明 |
|------|---------|------|
| Python | 3.12+ | 后端运行环境 |
| Node.js | 20+ | 前端构建环境 |
| Docker | 20.10+ | 学生容器管理 |
| Docker Compose | 2.0+ | 基础服务编排 |
| PostgreSQL | 16 | 数据存储（或用 Docker） |
| Redis | 7 | 缓存层（或用 Docker） |

### 外部服务
- **DeepSeek API 账户** ([platform.deepseek.com](https://platform.deepseek.com))
  - 需要有效的 API Key
  - 建议预留额度用于命令分析

### 端口要求

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend (Next.js) | 3000 | 前端开发服务 |
| Backend (FastAPI) | 8000 | API 服务 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存库 |
| Docker Socket | /var/run/docker.sock | Docker 引擎（Unix socket） |

---

##  本地开发部署

### 第一步：克隆仓库

```bash
git clone https://github.com/Leopardxv/GONGCHUANG.git
cd GONGCHUANG
```

### 第二步：设置后端环境

#### 2.1 创建 Python 虚拟环境

```bash
cd backend
python3 -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

#### 2.2 安装依赖

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 2.3 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下关键变量：

```env
# 应用配置
LL_APP_NAME=Linux Learning System
LL_DEBUG=true

# 数据库（本地开发可使用 Docker）
LL_DATABASE_URL=postgresql+asyncpg://lluser:llpass@localhost:5432/ll_db
LL_REDIS_URL=redis://localhost:6379/0

# JWT 认证（生产环境必须修改！）
LL_JWT_SECRET=your-random-secret-key-change-in-production

# AI 配置（必需）
LL_AI_API_KEY=sk-your-deepseek-api-key
LL_AI_MODEL=deepseek-v4-pro

# CORS 配置
LL_CORS_ORIGINS=["http://localhost:3000"]

# Docker 配置
LL_DOCKER_IMAGE=linux-student:latest
LL_DOCKER_NETWORK=ll-student-net
LL_DOCKER_MEMORY_LIMIT=2g
LL_DOCKER_CPU_LIMIT=1.0
LL_DOCKER_PIDS_LIMIT=100
```

#### 2.4 启动基础服务（PostgreSQL + Redis）

```bash
# 进入项目根目录
cd ..

# 使用 Docker Compose 启动数据库和缓存
docker compose -f docker/docker-compose.yml up -d
```

验证服务状态：
```bash
docker compose -f docker/docker-compose.yml ps
```

#### 2.5 初始化数据库

```bash
cd backend

# 方式一：使用 Python 脚本
python3 << 'EOF'
import asyncio
from app.database import engine
from app.models.base import Base
from app.modules.auth.model import User
from app.modules.terminal.model import DockerInstance, TerminalLog
from app.modules.ai.model import AIAnalysisLog

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(" Database initialized")

asyncio.run(init())
EOF

# 或者使用 Alembic（如果项目配置了迁移）
# alembic upgrade head
```

#### 2.6 启动后端服务

```bash
cd backend

# 开发模式（自动重载）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 或使用 Python 命令
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

后端启动成功后，访问 [http://localhost:8000/docs](http://localhost:8000/docs) 查看 API 文档。

### 第三步：设置前端环境

#### 3.1 安装依赖

```bash
cd frontend
npm install
```

#### 3.2 配置 API 端点

检查 `frontend/config/api.ts` 或环境配置，确保 API 指向本地后端：

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
```

#### 3.3 启动前端开发服务器

```bash
npm run dev
```

前端启动后，访问 [http://localhost:3000](http://localhost:3000)。

