# Linux 智能学习平台技术实现 README

###全部代码已开源至https://github.com/Leopardxv/GONGCHUANG

## 1. 项目概述

本项目面向 openEuler/Linux 实践教学场景，构建集数字教材、AI 导学问答、在线 Linux 实训、学习过程记录与教师学情分析于一体的智能学习平台。

系统不仅关注功能实现，更强调工程化设计，通过抽象编程、容器隔离和环境管理，实现平台的可扩展性、安全性与长期维护能力。

---

# 2. 整体架构设计

系统采用前后端分离架构：

```
┌──────────────────────────────┐
│          前端 Web            │
│                              │
│  学生主页  Playground        │
│  数字教材  AI 导学           │
│  教师看板  学情分析          │
└──────────────┬───────────────┘
               │ HTTP / WS
┌──────────────▼───────────────┐
│         后端服务层            │
│                              │
│  用户认证模块                │
│  AI 编排模块                 │
│  Docker 管理模块             │
│  数据持久化模块              │
│  教师分析模块                │
└──────────────┬───────────────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────▼─────┐    ┌──────▼──────┐
│ Database  │    │ Docker Pool │
│           │    │             │
│ 用户数据   │    │ student-001 │
│ 聊天记录   │    │ student-002 │
│ 终端日志   │    │ student-003 │
│ 学习卡片   │    │     ...     │
└───────────┘    └─────────────┘
```

---

# 3. 抽象编程设计思想

## 3.1 核心原则

系统采用"高内聚、低耦合"的抽象设计。

所有功能均被抽象为独立模块：

```
UI Layer
    ↓

Service Layer
    ↓

Infrastructure Layer
```

页面只负责展示。

业务逻辑统一放入 Service。

底层资源统一由 Infrastructure 管理。

---

## 3.2 功能模块抽象

### 用户模块

负责：

```
登录
注册
权限校验
Token管理
角色管理
```

接口：

```python
AuthService
```

---

### AI 模块

负责：

```
主页问答

Playground命令分析

学习卡片生成
```

接口：

```python
AIService
```

实现：

```python
ChatTutor

CommandAnalyzer
```

后续可替换不同模型：

```
OpenAI

DeepSeek

Qwen API
```

无需修改业务代码。

---

### Docker 模块

负责：

```
容器创建

容器查询

容器回收

容器状态监控
```

接口：

```python
ContainerService
```

实现：

```python
DockerManager
```

---

### 数据模块

负责：

```
聊天记录保存

命令记录保存

学习卡片保存

教师统计分析
```

接口：

```python
RecordService
```

---

## 3.3 抽象带来的优势

新增功能时：

```
新增AI模型

新增教师分析功能

新增终端环境
```

无需修改已有模块。

只需扩展对应 Service。

提高系统维护性。

---

# 4. 页面实现方式

## 4.1 学生主页

功能：

```
统一学习入口

AI导学问答

历史会话恢复
```

实现流程：

```
登录成功
    ↓
获取用户信息
    ↓
加载历史聊天
    ↓
初始化主页状态
```

技术：

```
JWT认证

REST API

数据库持久化
```

---

## 4.2 数字教材页面

功能：

```
教材阅读

章节导航

学习进度记录
```

实现：

```
教材文件解析
    ↓
目录树生成
    ↓
阅读状态保存
```

技术：

```
Markdown/PDF解析

数据库记录
```

---

## 4.3 Playground

功能：

```
Linux命令执行

实时输出

学习卡片生成
```

流程：

```
用户输入命令
      ↓
WebSocket发送
      ↓
Docker Shell执行
      ↓
stdout/stderr返回
      ↓
异步调用AI分析
      ↓
生成学习卡片
```

核心原则：

```
终端优先

AI并行
```

保证终端体验。

---

## 4.4 教师端

功能：

```
班级统计

学习趋势

错误分析

学生画像
```

流程：

```
终端日志
      ↓
行为统计
      ↓
指标计算
      ↓
图表展示
```

---

# 5. Docker 实训环境设计

这是整个系统最核心的工程实现。

---

## 5.1 为什么使用 Docker

传统方案：

```
所有学生共享服务器
```

问题：

```
互相影响

环境被污染

权限难控制

难以恢复
```

Docker方案：

```
每人独立Linux环境
```

优势：

```
安全隔离

环境一致

快速创建

易于管理
```

---

# 6. 每个学生 Docker 的组织方式

系统为每个学生分配专属容器。

结构如下：

```
Server
│
├─ student001
│      └─ container_001
│
├─ student002
│      └─ container_002
│
├─ student003
│      └─ container_003
│
└─ ...
```

数据库记录：

```
User
    ↓
ContainerID
```

例如：

```
student001

↓

linux_lab_student001
```

用户进入 Playground：

```
查询绑定容器
      ↓

存在 → 直接连接

不存在 → 自动创建
```

---

# 7. Docker 生命周期管理

容器创建：

```
首次进入Playground
```

容器运行：

```
学习过程中持续使用
```

容器暂停：

```
用户退出登录
```

容器销毁：

```
课程结束

管理员清理
```

流程：

```
Login
   ↓

Enter Playground
   ↓

Check Container
   ↓
┌─────────────┐
│ Exist ?     │
└──────┬──────┘
       │
   Yes │ No
       │
       ↓
  Connect
       │
       ↓
  Create Docker
       │
       ↓
  Execute Command
```

---

# 8. Docker 内部结构

每个容器内部：

```
openEuler/Linux
│
├─ bash
├─ 常用Linux命令
├─ 教学测试文件
└─ 学生工作目录
```

学生只能访问：

```
/home/student
```

无法影响宿主机。

---

# 9. WebSocket 与 Docker 通信

连接关系：

```
Browser
    ↓
WebSocket
    ↓
Backend
    ↓
Docker API
    ↓
Container Shell
```

实现效果：

```
浏览器 ≈ 本地终端
```

学生获得真实 Linux 操作体验。

---

# 10. Python venv 环境管理

开发阶段采用：

```
venv
```

进行依赖隔离。

结构：

```
project/
│
├─ backend/
├─ frontend/
├─ .venv/
├─ requirements.txt
└─ README.md
```

作用：

```
避免系统环境污染

避免依赖冲突

保证部署一致性
```

部署步骤：

```bash
python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt
```

通过：

```
requirements.txt
```

即可快速重建环境。

---

# 11. 核心工程特点

本项目不仅实现了 Linux 教学平台的功能需求，更注重工程化设计。

主要特点包括：

```
抽象编程设计
↓
提高扩展能力

Docker 独立实验环境
↓
保证教学安全与一致性

学生专属容器管理
↓
实现真实在线实训

venv 环境隔离
↓
提高开发与部署效率

WebSocket 实时通信
↓
提供接近本地终端的体验
```

这些设计共同支撑了平台从课程演示系统向长期运行教学平台演进的可能性。