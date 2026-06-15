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

## 🚀 一键部署与复刻指南 (推荐)

本项目已全面支持 Docker 容器化部署。无论你是 Windows, Mac 还是 Linux，只需满足基础条件即可一键把**所有环境**（前端、后端、数据库、缓存、终端镜像）全部拉起！

### 1. 环境准备
在开始之前，请确保您的开发机器上已安装以下软件：
- **Docker** 以及 **Docker Compose**
  - *(注意：Windows 用户安装 Docker Desktop 后，系统会自动配置好这两项)*
- **Git**
- **DeepSeek API Key**：需要前往 [DeepSeek 开放平台](https://platform.deepseek.com) 申请一个 API Key。

### 2. 克隆项目
```bash
git clone https://github.com/Leopardxv/GONGCHUANG.git
cd GONGCHUANG
```

### 3. 配置密钥 (只需一次)
在项目根目录下创建一个 `.env` 文件（如果没有提供，可以自己新建一个），并填入以下必须的内容：
```env
# JWT 加密密钥 (随便填一串复杂的随机字符即可)
LL_JWT_SECRET=your_super_secret_jwt_key_here

# 必填：你的 DeepSeek API Key，用于驱动 AI 对话和代码分析
LL_AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. 一键启动！🚀
在项目根目录下运行以下命令：
```bash
docker-compose up -d --build
```

**就这么简单！**
这行命令会在后台自动执行以下所有操作，您只需喝杯咖啡等待（首次构建可能需要几分钟）：
- 自动拉起 `PostgreSQL` 数据库和 `Redis` 缓存。
- 自动构建 `linux-student:latest` 学生终端的专属基础镜像。
- 自动构建并启动 FastAPI 后端（内置依赖安装与数据库自动初始化迁移）。
- 自动构建并启动 Next.js 前端应用。

### 5. 访问项目
- 浏览器打开：`http://localhost:3000`
- 注册一个账号，即可开始 Linux 学习之旅！
- （可选）后端 API 接口文档地址为：`http://localhost:8000/docs`

### 6. 停止与关闭
如果您想停止并移除容器，只需在项目根目录运行：
```bash
docker-compose down
```

---

## 🛠 开发模式 (传统部署)

如果您需要进行代码级的二次开发并频繁调试，可以选择传统的本地运行方式。请参考项目内的 `start.bat` (Windows) 或 `start.sh` (Linux/Mac) 脚本，配合手动安装 Node.js 和 Python 环境进行启动。传统开发模式详细步骤可参考历史提交记录或通过 `.sh` 脚本自行探索。

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
