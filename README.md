# 共创 Linux 学习平台 (GONGCHUANG)

AI 驱动的互动式 Linux 在线学习平台。学生可以在真实的云端终端（基于 Docker 容器隔离）中练习 Linux 命令，并获得基于大模型（DeepSeek）的实时代码分析、纠错和学习辅导。

## ✨ 核心特性

- **真实的 Linux 终端环境**：基于 xterm.js 与后端 WebSocket 实时通讯，每个学生分配独立隔离的 Docker 容器。
- **全方位 AI 伴学**：集成 DeepSeek API，一键分析命令行报错，对话式解答疑问，智能推荐下一步学习路径。
- **智能数字教材**：自带系统操作基础教程，支持与 AI 对话联动、一键代码直达终端运行、一键跳转到对应教材页数。
- **进度追踪与记录**：系统自动保存学生的学习进度（教材浏览页数、命令执行历史等），支持断点续学。

## 🛠️ 技术架构

- **前端**：Next.js 15 (App Router), React, TailwindCSS, xterm.js, Zustand
- **后端**：FastAPI (Python 3.12), SQLAlchemy (异步), Alembic, Docker SDK for Python
- **依赖服务**：PostgreSQL 16 (持久化数据), Redis 7 (AI 聊天上下文/状态缓存)
- **环境隔离**：Docker (为每个在线用户动态拉起 `linux-student` 容器镜像)

---

## 🚀 详细复刻与部署指南

请严格按照以下步骤进行本地复刻和运行。

### 1. 环境准备 (Prerequisites)
在开始之前，请确保您的开发机器上已安装以下软件：
- **Node.js** (>= 20)
- **Python** (>= 3.12)
- **Docker & Docker Compose** (用于运行数据库和学生终端)
- **Git**
- **DeepSeek API Key**：需要前往 [DeepSeek 开放平台](https://platform.deepseek.com) 申请一个 API Key。

### 2. 克隆项目
```bash
git clone https://github.com/Leopardxv/GONGCHUANG.git
cd GONGCHUANG
```

### 3. 启动基础设施 (PostgreSQL & Redis)
我们使用 Docker Compose 来快速启动数据库和缓存：
```bash
cd docker
docker-compose up -d
cd ..
```
*这会在后台启动端口为 `5432` 的 PG 数据库和 `6379` 的 Redis 服务。*

### 4. 后端环境配置与启动 (Backend)

**① 进入后端目录并创建虚拟环境：**
```bash
cd backend
python -m venv .venv

# Windows 激活虚拟环境:
.venv\Scripts\activate
# Mac/Linux 激活虚拟环境:
source .venv/bin/activate
```

**② 安装 Python 依赖：**
```bash
pip install -r requirements.txt
```

**③ 配置环境变量：**
复制示例配置文件并修改配置：
```bash
cp .env.example .env
```
用文本编辑器打开 `backend/.env`，确保填写以下必填项：
```env
# 数据库与 Redis (默认值通常无需修改)
LL_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/linux_learning
LL_REDIS_URL=redis://localhost:6379/0

# JWT 加密密钥 (随便填一串复杂的随机字符)
LL_JWT_SECRET=your_super_secret_jwt_key_here

# 必填：你的 DeepSeek API Key
LL_AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**④ 初始化数据库表结构：**
在虚拟环境激活状态下，执行数据库迁移（Alembic）：
```bash
alembic upgrade head
```

### 5. 构建学生终端基础镜像
为了让系统能够为学生创建隔离的终端，您必须先在本地构建基础镜像：
```bash
# 退回到项目根目录
cd ..

# 创建专属 Docker 网络
docker network create ll-student-net

# 构建基础镜像 (必须执行)
bash scripts/build_student_image.sh
```

### 6. 前端环境配置与启动 (Frontend)
```bash
cd frontend

# 安装前端依赖
npm install

# (可选) 检查前端环境变量
# 前端默认连接 http://localhost:8000，如果你的后端端口不同，需在 frontend 下创建 .env.local 覆盖。

# 启动前端开发服务器
npm run dev
```

此时，您可以通过浏览器访问 `http://localhost:3000` 来体验项目。后端 API 接口文档地址为：`http://localhost:8000/docs`。

---

## ⚡ 快捷一键启停脚本 (推荐在环境搭建完成后使用)

如果您**已经完成了上面的环境搭建（依赖已安装、环境变量已配置、镜像已构建）**，以后每次开发/使用时，无需再手动一行行敲命令。

项目根目录下提供了非常方便的**一键启停脚本**：

### Windows 用户
- **启动服务**：双击运行根目录下的 `start.bat`
- **停止服务**：双击运行根目录下的 `stop.bat`

### Mac / Linux 用户
- **启动服务**：在终端执行 `bash start.sh`
- **停止服务**：在终端执行 `bash stop.sh`

*(注意：一键启动脚本默认不会自动拉起 docker-compose 的 PG/Redis，请确保 Docker 桌面端已经运行并且相关容器处于启动状态)*

---

## 📂 项目目录结构
```text
GONGCHUANG/
├── frontend/           # Next.js 前端代码
├── backend/            # FastAPI 后端代码
│   ├── app/
│   │   ├── modules/    # 核心业务模块 (auth, terminal, ai)
│   │   ├── database.py # 数据库连接
│   │   └── main.py     # 程序入口
│   └── alembic/        # 数据库迁移脚本
├── docker/             # 基础服务 docker-compose 配置文件
├── scripts/            # 构建学生终端镜像的脚本
├── start.bat/sh        # 一键启动脚本
└── stop.bat/sh         # 一键停止脚本
```

## 📝 许可协议
MIT License
