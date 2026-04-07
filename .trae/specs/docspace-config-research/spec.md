# DocSpace 配置调研与分析

## Why

需要全面了解 DocSpace 项目正常运行所需的各种配置项，并检查当前 WSL Ubuntu 中聚合模式部署的各服务配置状态，确保服务完整可用。

## What Changes

### 调研范围

根据 `docs/文档说明.md` 索引的文档，调研以下配置需求：

1. **服务端文档调研**
   - ASC.SsoAuth (SSO认证) - 配置要求
   - ASC.Socket.IO (实时通信) - 配置要求
   - DocStore (文档存储) - 配置要求

2. **前端文档调研**
   - Client 主应用配置
   - translation-app 配置
   - 各组件配置

3. **构建/部署文档调研**
   - Docker 部署配置
   - OneClickInstall 配置
   - 环境变量配置
   - 数据库配置

4. **当前部署配置检查**
   - WSL Ubuntu 中的 Docker 服务配置
   - 各容器环境变量
   - 各服务端口映射
   - 基础设施服务配置（MySQL/Redis/RabbitMQ）

## Impact

- 确认 DocSpace 聚合模式部署的完整性
- 识别缺失的必要配置
- 提供配置完善建议

## 配置需求分析

### 必需的配置项（基于文档）

| 类别 | 配置项 | 文档来源 |
|------|--------|----------|
| JWT | DOCUMENT_SERVER_JWT_SECRET | buildtools/install/docker/Readme.md |
| 安全 | APP_CORE_MACHINEKEY | buildtools/install/docker/Readme.md |
| JWT Header | DOCUMENT_SERVER_JWT_HEADER | buildtools/install/docker/Readme.md |
| 数据库 | MySQL 连接信息 | 部署说明.md |
| 缓存 | Redis 连接信息 | 部署说明.md |
| 消息队列 | RabbitMQ 连接信息 | 部署说明.md |
| 应用URL | APP_URL_PORTAL | 部署说明.md |

### 已知部署模式配置

根据 `docs/部署说明.md`：
- 聚合模式 (docspace-stack.yml)：4个业务容器
- 基础设施：MySQL/Redis/RabbitMQ
- 端口映射：docspace-ports.yml

## 调研任务

1. 阅读服务端组件文档，提取配置要求
2. 阅读前端文档，提取配置要求
3. 阅读构建工具文档，提取配置要求
4. 检查当前运行的 Docker 容器环境变量
5. 检查 MySQL 数据库配置
6. 检查 Redis 配置
7. 检查 RabbitMQ 配置
8. 生成配置完整性报告
