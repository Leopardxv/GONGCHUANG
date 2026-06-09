# 🚀 GONGCHUANG 部署指南

AI-Enhanced Linux Online Learning Platform 的完整部署方案。本文档涵盖本地开发、Docker 容器化、以及生产环境部署。

---

## 📋 目录

- [系统要求](#系统要求)
- [本地开发部署](#本地开发部署)
- [Docker Compose 快速部署](#docker-compose-快速部署)
- [生产环境部署](#生产环境部署)
- [故障排查](#故障排查)
- [性能优化](#性能优化)

---

## 📦 系统要求

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

## 🏠 本地开发部署

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
    print("✅ Database initialized")

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

### 第四步：构建学生 Docker 镜像

#### 4.1 创建 Docker 网络

```bash
# 返回项目根目录
cd ..

docker network create ll-student-net
```

#### 4.2 构建学生镜像

```bash
bash scripts/build_student_image.sh
```

该脚本执行：
- 基于 Ubuntu 24.04 构建镜像
- 安装必要工具（bash、git、gcc、make 等）
- 创建非 root `student` 用户
- 生成镜像标签：`linux-student:latest`

验证镜像：
```bash
docker images | grep linux-student
```

### 第五步：测试完整流程

#### 5.1 注册用户

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "test123456",
    "role": "student"
  }'
```

#### 5.2 连接终端

打开浏览器 [http://localhost:3000](http://localhost:3000)，登录并尝试在终端中执行命令。

#### 5.3 验证 AI 分析

执行一个命令，检查是否收到 AI 的分析反馈。

---

## 🐳 Docker Compose 快速部署

使用 Docker Compose 可以一键启动整个应用栈（包括后端、前端服务）。

### 方式一：完整 Docker 堆栈

创建 `docker-compose.full.yml`：

```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: lluser
      POSTGRES_PASSWORD: llpass
      POSTGRES_DB: ll_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lluser -d ll_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ll-network

  # Redis 缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ll-network

  # FastAPI 后端
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      LL_DEBUG: "false"
      LL_DATABASE_URL: postgresql+asyncpg://lluser:llpass@postgres:5432/ll_db
      LL_REDIS_URL: redis://redis:6379/0
      LL_JWT_SECRET: ${LL_JWT_SECRET:-change-me-in-production}
      LL_AI_API_KEY: ${LL_AI_API_KEY}
      LL_CORS_ORIGINS: '["http://localhost:3000"]'
      LL_DOCKER_NETWORK: ll-student-net
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - ll-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Next.js 前端
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
    depends_on:
      - backend
    networks:
      - ll-network

networks:
  ll-network:
    driver: bridge

volumes:
  pgdata:
```

### 启动容器

```bash
# 构建所有镜像
docker compose -f docker-compose.full.yml build

# 启动所有服务
docker compose -f docker-compose.full.yml up -d

# 查看日志
docker compose -f docker-compose.full.yml logs -f

# 停止所有服务
docker compose -f docker-compose.full.yml down
```

### 验证部署状态

```bash
# 检查容器
docker compose -f docker-compose.full.yml ps

# 检查网络
docker network inspect ll-network

# 验证后端健康状态
curl http://localhost:8000/health
```

---

## 🌍 生产环境部署

### 预部署检查清单

- [ ] 设置强大的 `LL_JWT_SECRET`（至少 32 字符）
- [ ] 配置生产级 PostgreSQL（外部 RDS 或主从）
- [ ] 配置生产级 Redis（哨兵或集群模式）
- [ ] 设置 HTTPS 证书（Let's Encrypt）
- [ ] 配置反向代理（Nginx）
- [ ] 设置日志聚合（ELK Stack 或类似）
- [ ] 配置监控告警（Prometheus + Grafana）
- [ ] 制定备份策略
- [ ] 进行安全审计

### 方式一：使用 Kubernetes

#### 1. 构建镜像并推送到镜像仓库

```bash
# 后端镜像
docker build -t your-registry/ll-backend:v1.0 ./backend
docker push your-registry/ll-backend:v1.0

# 前端镜像
docker build -t your-registry/ll-frontend:v1.0 ./frontend
docker push your-registry/ll-frontend:v1.0

# 学生容器镜像
docker build -t your-registry/linux-student:v1.0 ./docker/student-image
docker push your-registry/linux-student:v1.0
```

#### 2. 创建 Kubernetes 配置

**后端部署 (backend-deployment.yaml)：**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ll-backend
  namespace: learning-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ll-backend
  template:
    metadata:
      labels:
        app: ll-backend
    spec:
      containers:
      - name: backend
        image: your-registry/ll-backend:v1.0
        ports:
        - containerPort: 8000
        env:
        - name: LL_DEBUG
          value: "false"
        - name: LL_DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        - name: LL_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        - name: LL_AI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-credentials
              key: api-key
        - name: LL_DOCKER_NETWORK
          value: ll-student-net
        volumeMounts:
        - name: docker-socket
          mountPath: /var/run/docker.sock
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: docker-socket
        hostPath:
          path: /var/run/docker.sock
---
apiVersion: v1
kind: Service
metadata:
  name: ll-backend-service
  namespace: learning-system
spec:
  selector:
    app: ll-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

**应用配置：**

```bash
# 创建命名空间
kubectl create namespace learning-system

# 创建 Secret
kubectl create secret generic db-credentials \
  --from-literal=connection-string='postgresql+asyncpg://user:pass@rds-host:5432/db' \
  -n learning-system

kubectl create secret generic jwt-secret \
  --from-literal=secret='your-very-secure-random-secret-here' \
  -n learning-system

kubectl create secret generic ai-credentials \
  --from-literal=api-key='sk-your-deepseek-api-key' \
  -n learning-system

# 部署
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

### 方式二：使用 Docker Swarm

```bash
# 初始化 Swarm
docker swarm init

# 创建网络
docker network create --driver overlay ll-network

# 构建和推送镜像（同上）

# 部署栈
docker stack deploy -c docker-compose.prod.yml ll-app
```

### 方式三：使用云托管服务

#### 部署到 AWS Fargate

```bash
# 1. 创建 ECR 仓库
aws ecr create-repository --repository-name ll-backend --region us-east-1

# 2. 登录 ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 3. 推送镜像
docker tag ll-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ll-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ll-backend:latest

# 4. 创建 ECS Task Definition 和 Service
# （使用 AWS 控制台或 CLI）
```

#### 部署到 Heroku

```bash
# 1. 登录 Heroku
heroku login

# 2. 创建应用
heroku create ll-app

# 3. 配置环境变量
heroku config:set LL_JWT_SECRET=your-secret -a ll-app
heroku config:set LL_AI_API_KEY=sk-xxx -a ll-app

# 4. 推送代码
git push heroku main

# 5. 运行迁移
heroku run python -c "asyncio.run(init())" -a ll-app
```

### 生产级配置文件示例

**Nginx 反向代理 (nginx.conf):**

```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # API 后端
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # WebSocket 终端
    location /api/v1/terminal/connect {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # 健康检查
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}

server {
    listen 443 ssl http2;
    server_name www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# 重定向 HTTP 到 HTTPS
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

**系统资源限制优化 (sysctl.conf):**

```bash
# 增加文件描述符限制
fs.file-max = 2097152
fs.nr_open = 2097152

# 网络优化
net.core.somaxconn = 32768
net.ipv4.tcp_max_syn_backlog = 32768
net.ipv4.tcp_tw_reuse = 1

# Docker 相关
vm.overcommit_memory = 1
vm.max_map_count = 262144
```

---

## 🔧 故障排查

### 常见问题

#### 1. 数据库连接失败

**错误信息：**
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server
```

**解决方案：**
```bash
# 检查 PostgreSQL 是否运行
docker compose -f docker/docker-compose.yml ps postgres

# 查看 PostgreSQL 日志
docker compose -f docker/docker-compose.yml logs postgres

# 测试连接
psql -h localhost -U lluser -d ll_db -W
```

#### 2. WebSocket 连接失败

**错误信息：**
```
WebSocket connection failed: Expected HTTP 101 Switching Protocols
```

**解决方案：**
```bash
# 检查 CORS 配置
curl -H "Origin: http://localhost:3000" http://localhost:8000/api/v1/terminal/connect

# 检查防火墙规则
sudo ufw status
sudo ufw allow 8000/tcp

# 检查 Nginx 配置（生产环境）
nginx -t
```

#### 3. Docker 权限错误

**错误信息：**
```
docker.errors.DockerException: Error while fetching server API version: 'NoneType' object is not subscriptable
```

**解决方案：**
```bash
# 添加用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 或使用 sudo
sudo docker ps

# 检查 Docker Socket 权限
ls -l /var/run/docker.sock
```

#### 4. AI API 配置问题

**错误信息：**
```
openai.AuthenticationError: Incorrect API key provided
```

**解决方案：**
```bash
# 验证 API Key
echo $LL_AI_API_KEY

# 测试连接
curl -H "Authorization: Bearer $LL_AI_API_KEY" https://api.deepseek.com/models

# 检查余额
# 访问 https://platform.deepseek.com/console/billing/overview
```

#### 5. 内存溢出

**错误信息：**
```
MemoryError: Unable to allocate memory
```

**解决方案：**
```bash
# 增加 Docker 容器内存限制
docker update --memory 4g container-name

# 检查系统内存
free -h

# 清理 Docker 资源
docker system prune -a
```

### 调试模式

#### 启用详细日志

```bash
# 后端
LL_DEBUG=true uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level debug

# 前端
DEBUG=* npm run dev

# Docker
docker compose -f docker/docker-compose.yml logs -f --tail=100
```

#### 获取实时日志

```bash
# 后端容器日志
docker logs -f backend-container-id

# 数据库日志
docker logs -f postgres-container-id

# 查看特定模块日志
docker logs -f backend-container-id 2>&1 | grep terminal
```

---

## ⚡ 性能优化

### 数据库优化

#### 创建索引

```sql
-- 连接到数据库
psql -h localhost -U lluser -d ll_db

-- 创建索引
CREATE INDEX idx_terminal_logs_user_id ON terminal_logs(user_id);
CREATE INDEX idx_terminal_logs_session_id ON terminal_logs(session_id);
CREATE INDEX idx_ai_analysis_user_id ON ai_analysis_logs(user_id);
CREATE INDEX idx_docker_instances_user_id ON docker_instances(user_id);

-- 分析查询计划
EXPLAIN ANALYZE SELECT * FROM terminal_logs WHERE user_id = 'xxx';
```

#### 连接池配置

编辑 `backend/app/database.py`：

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import NullPool, QueuePool

engine = create_async_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.DEBUG
)
```

### 缓存优化

#### Redis 配置优化

```bash
# 编辑 redis.conf
vim /etc/redis/redis.conf

# 或在 docker-compose 中配置
command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

#### 应用级缓存

在 `backend/app/modules/ai/service.py` 中已实现命令分析缓存：

```python
_analysis_cache: dict[tuple[str, bool, int], CommandAnalysisResponse] = {}
CACHE_MAX_SIZE = 200
```

可根据需求调整缓存大小：

```python
CACHE_MAX_SIZE = 1000  # 增加到 1000 条
```

### API 性能优化

#### 启用 GZIP 压缩

```python
# backend/app/main.py
from fastapi.middleware.gzip import GZIPMiddleware

app.add_middleware(GZIPMiddleware, minimum_size=1000)
```

#### 异步处理

确保使用异步操作：

```python
# ✅ 正确
async def handle_command():
    async with async_session() as db:
        result = await db.execute(...)

# ❌ 避免
def handle_command():
    with sync_session() as db:
        result = db.execute(...)
```

### 前端性能优化

#### 代码分割

```typescript
// next.config.js
module.exports = {
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
}
```

#### 图片优化

使用 Next.js Image 组件：

```tsx
import Image from 'next/image'

export default function Terminal() {
  return (
    <Image
      src="/logo.png"
      alt="Logo"
      width={100}
      height={100}
      priority
    />
  )
}
```

### 监控和指标

#### Prometheus 监控

创建 `docker/prometheus.yml`：

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'fastapi'
    static_configs:
      - targets: ['localhost:8000']
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:5432']
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:6379']
```

#### 性能基准测试

```bash
# 使用 Apache Bench 测试 API
ab -n 1000 -c 10 http://localhost:8000/health

# 使用 wrk 进行压力测试
wrk -t4 -c100 -d30s http://localhost:8000/health

# 数据库性能测试
pgbench -i -s 10 ll_db
```

---

## 📚 相关文档

- [API 文档](./docs/API.md)
- [架构设计](./docs/ARCHITECTURE.md)
- [数据模型](./docs/DATA_MODEL.md)
- [安全指南](./docs/SECURITY.md)

---

## 🆘 获取帮助

### 常用命令速查

```bash
# Docker 操作
docker compose -f docker/docker-compose.yml up -d          # 启动服务
docker compose -f docker/docker-compose.yml down           # 停止服务
docker compose -f docker/docker-compose.yml logs -f        # 查看日志
docker compose -f docker/docker-compose.yml restart        # 重启服务

# 数据库操作
psql -h localhost -U lluser -d ll_db                       # 连接数据库
\dt                                                         # 列出表
\d table_name                                               # 查看表结构

# 后端操作
source backend/.venv/bin/activate                          # 激活虚拟环境
pip install -r backend/requirements.txt                    # 安装依赖
python -m pytest backend/tests/                            # 运行测试

# 前端操作
cd frontend && npm install                                 # 安装依赖
npm run build                                              # 构建生产版本
npm run lint                                               # 代码检查
```

### 报告问题

提交 Issue 时请包含：
- 部署方式（本地 / Docker / K8s）
- 操作系统版本
- 完整错误日志
- 复现步骤

### 社区支持

- 📧 Email: support@example.com
- 💬 GitHub Discussions: [GONGCHUANG Discussions](https://github.com/Leopardxv/GONGCHUANG/discussions)
- 📖 Wiki: [项目 Wiki](https://github.com/Leopardxv/GONGCHUANG/wiki)

---

**最后更新**: 2026-06-09  
**维护者**: [@Leopardxv](https://github.com/Leopardxv)  
**License**: MIT
