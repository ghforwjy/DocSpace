# WebSocket实时通信服务流程

## 1. 整体架构

ASC.Socket.IO 是 DocSpace 系统的 WebSocket 实时通信服务，基于 Socket.IO 4.x 实现，支持多租户架构的实时文件操作、用户管理、备份进度等事件推送。

### 1.1 服务基本信息

| 属性 | 值 |
|------|-----|
| 服务名称 | ASC.Socket.IO |
| 技术栈 | Node.js 20+, Socket.IO 4.7.5, Express 4.17, Redis |
| 默认端口 | 9899 |
| 配置文件 | config/config.json |
| Docker镜像 | Node.js 20-alpine |
| 日志框架 | Winston (支持文件轮转 + CloudWatch) |
| 所在容器 | onlyoffice-common |

### 1.2 核心依赖

```json
{
  "socket.io": "^4.7.5",
  "@socket.io/redis-adapter": "^8.3.0",
  "express": "~4.17.2",
  "express-session": "~4.17.2",
  "redis": "^4.6.14",
  "connect-redis": "~7.1.1",
  "axios": "0.24.0",
  "winston": "^3.8.2"
}
```

---

## 2. 目录结构

```
ASC.Socket.IO/
├── server.js                 # 主入口文件
├── package.json
├── config/
│   ├── index.js              # 配置加载器 (nconf)
│   └── config.json           # 本地配置
├── app/
│   ├── log.js                # Winston日志配置
│   ├── requestManager.js     # HTTP请求封装 (axios)
│   ├── portalManager.js      # Portal域名解析
│   ├── hubs/
│   │   └── files.js          # 文件Hub (核心业务逻辑)
│   ├── middleware/
│   │   ├── auth.js           # Socket连接认证中间件
│   │   └── authService.js    # Token验证服务
│   └── controllers/
│       ├── index.js          # 路由总览
│       ├── files.js          # 文件操作控制器 (HTTP API)
│       └── healthCheck.js    # 健康检查
└── Dockerfile
```

---

## 3. 服务端口与配置

### 3.1 服务端口配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| app.port | 9899 | Socket.IO 服务监听端口 |
| Redis连接 | config.get("Redis") | 从 appsettings 加载 |
| API_HOST | config.get("API_HOST") | 后端API地址 |
| core.machinekey | config.get("core").machinekey | 机器密钥用于Token验证 |

---

## 4. 工作流程

### 4.1 服务启动流程

```
server.js 入口
    │
    ▼
加载配置文件 (config/index.js)
    │
    ▼
初始化 Winston 日志系统
    │
    ▼
创建 Express 应用
    │
    ▼
初始化 Redis 连接 (可选，无Redis则用MemoryStore)
    │
    ▼
创建 HTTP Server
    │
    ▼
配置 Socket.IO (CORS + allowRequest)
    │
    ▼
注册 Socket.IO 中间件
    │   ├── sharedsession (会话共享)
    │   ├── baseCookieParser
    │   └── auth (认证中间件)
    │
    ▼
配置 Redis Adapter (可选，多Socket.IO实例通信)
    │
    ▼
注册 Express 路由
    │   ├── /controller/* -> files API
    │   └── /health -> 健康检查
    │
    ▼
注册 files Hub (Socket.IO 事件处理)
    │
    ▼
httpServer.listen(9899)
```

### 4.2 Socket.IO 连接认证流程

```
客户端连接请求
    │
    ▼
allowRequest 验证
    │   检查 Authorization/Cookie/share query参数
    │   无Token则拒绝连接
    │
    ▼
sharedsession 中间件
    │   同步Express session到Socket.IO
    │
    ▼
baseCookieParser 中间件
    │   解析Cookie
    │
    ▼
auth 中间件
    │
    ├── Token认证 (system用户)
    │   └── authService.check(token) -> HMAC SHA1验证
    │
    ├── Cookie认证 (普通用户)
    │   ├── 获取用户信息 /people/@self
    │   ├── 获取Portal信息 /portal
    │   └── 验证分享链接 /files/share/{share}
    │
    └── Share Key认证 (匿名用户)
        └── 验证分享链接有效性
    │
    ▼
认证成功 -> 保存session -> next()
认证失败 -> socket.disconnect("Unauthorized")
```

### 4.3 认证Token格式

Token格式: `pkey:{timestamp}:{hmac_hash}`

```
pkey          - 前缀
{timestamp}   - UTC时间 YYYYMMDDHHmmss
{hmac_hash}   - HMAC-SHA1(date + "\n" + pkey, machinekey) 的base64编码
```

信任时间窗口: 5分钟 (trustInterval = 5 * 60 * 1000)

---

## 5. Hub业务逻辑 (files.js)

### 5.1 Socket.IO 事件列表

#### 客户端 -> 服务端事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| subscribe | {roomParts, individual} | 订阅房间 |
| unsubscribe | {roomParts, individual} | 取消订阅 |
| subscribeInSpaces | {roomParts, individual} | 订阅房间(空间) |
| unsubscribeInSpaces | {roomParts, individual} | 取消订阅(空间) |
| refresh-folder | folderId | 刷新文件夹 |
| restore-backup | {dump} | 恢复备份 |
| storage-encryption | - | 存储加密 |
| ping | date | 心跳检测 |

#### 服务端 -> 客户端事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| connection-init | - | 连接初始化完成 |
| refresh-folder | folderId | 刷新文件夹通知 |
| restore-backup | - | 恢复备份通知 |
| storage-encryption | - | 存储加密通知 |
| pong | moment.utc() | 心跳响应 |
| s:start-edit-file | fileId | 开始编辑文件 |
| s:stop-edit-file | fileId | 停止编辑文件 |
| s:modify-folder | {cmd, id, type, data} | 文件夹变更 |
| s:modify-room | {cmd, id, type, data, isOneMember} | 房间变更 |
| s:markasnew-file | {fileId, count} | 新文件标记 |
| s:markasnew-folder | {folderId, count} | 新文件夹标记 |
| s:change-quota-used-value | {featureId, value} | 配额变更 |
| s:change-user-quota-used-value | {customQuotaFeature, usedSpace, quotaLimit} | 用户配额变更 |
| s:change-invitation-limit-value | value | 邀请限制变更 |
| s:update-history | {id, type} | 历史更新 |
| s:logout-session | {loginEventId, redirectUrl} | 会话登出 |
| s:backup-progress | {progress} | 备份进度 |
| s:restore-progress | {progress} | 恢复进度 |
| s:change-my-type | {id, data, admin, hasPersonalFolder} | 用户类型变更 |
| s:add-user / s:update-user / s:delete-user | user数据 | 用户管理 |
| s:add-group / s:update-group / s:delete-group | group数据 | 用户组管理 |
| s:add-guest / s:update-guest / s:delete-guest | guest数据 | 访客管理 |
| s:telegram / s:update-telegram | userId/username | Telegram集成 |
| s:encryption-progress | {percentage, error} | 加密进度 |
| s:self-restriction-file | {id, data} | 文件权限限制 |
| s:self-restriction-folder | {id, data} | 文件夹权限限制 |
| s:commit-chat-message | {messageId} | 聊天消息提交 |
| s:update-chat | {chatId, chatTitle} | 聊天更新 |
| s:export-chat | {resultFile, error} | 聊天导出 |
| s:change-access-rights-file | {id, data} | 文件访问权限变更 |
| s:change-access-rights-folder | {id, data} | 文件夹访问权限变更 |

---

## 6. HTTP API 控制器

### 6.1 文件操作API (POST /controller/files/*)

所有API都需要Token认证 (通过 authService.check)

| API端点 | 事件触发 | 说明 |
|---------|----------|------|
| POST /controller/files/start-edit | files.startEdit | 开始编辑 |
| POST /controller/files/stop-edit | files.stopEdit | 停止编辑 |
| POST /controller/files/create-file | files.createFile | 创建文件 |
| POST /controller/files/create-form | files.createForm | 创建表单 |
| POST /controller/files/create-folder | files.createFolder | 创建文件夹 |
| POST /controller/files/update-file | files.updateFile | 更新文件 |
| POST /controller/files/update-folder | files.updateFolder | 更新文件夹 |
| POST /controller/files/delete-file | files.deleteFile | 删除文件 |
| POST /controller/files/delete-folder | files.deleteFolder | 删除文件夹 |
| POST /controller/files/mark-as-new-file | files.markAsNewFiles | 标记新文件 |
| POST /controller/files/mark-as-new-folder | files.markAsNewFolders | 标记新文件夹 |
| POST /controller/files/change-quota-used-value | files.changeQuotaUsedValue | 配额变更 |
| POST /controller/files/change-quota-feature-value | files.changeQuotaFeatureValue | 配额特性变更 |
| POST /controller/files/change-user-quota-used-value | files.changeUserQuotaFeatureValue | 用户配额变更 |
| POST /controller/files/change-invitation-limit-value | files.changeInvitationLimitValue | 邀请限制变更 |
| POST /controller/files/update-history | files.updateHistory | 更新历史 |
| POST /controller/files/logout-session | files.logoutSession | 会话登出 |
| POST /controller/files/change-my-type | files.changeMyType | 用户类型变更 |
| POST /controller/files/add-user | files.addUser | 添加用户 |
| POST /controller/files/update-user | files.updateUser | 更新用户 |
| POST /controller/files/delete-user | files.deleteUser | 删除用户 |
| POST /controller/files/add-group | files.addGroup | 添加用户组 |
| POST /controller/files/update-group | files.updateGroup | 更新用户组 |
| POST /controller/files/delete-group | files.deleteGroup | 删除用户组 |
| POST /controller/files/add-guest | files.addGuest | 添加访客 |
| POST /controller/files/update-guest | files.updateGuest | 更新访客 |
| POST /controller/files/delete-guest | files.deleteGuest | 删除访客 |
| POST /controller/files/telegram | files.connectTelegram | Telegram连接 |
| POST /controller/files/update-telegram | files.updateTelegram | Telegram更新 |
| POST /controller/files/backup-progress | files.backupProgress | 备份进度 |
| POST /controller/files/restore-progress | files.restoreProgress | 恢复进度 |
| POST /controller/files/end-backup | files.endBackup | 备份完成 |
| POST /controller/files/end-restore | files.endRestore | 恢复完成 |
| POST /controller/files/encryption-progress | files.encryptionProgress | 加密进度 |
| POST /controller/files/self-restriction-file | files.selfRestrictionForFile | 文件权限限制 |
| POST /controller/files/self-restriction-folder | files.selfRestrictionForFolder | 文件夹权限限制 |
| POST /controller/files/commit-chat-message | files.commitChatMessage | 聊天消息提交 |
| POST /controller/files/update-chat | files.updateChat | 聊天更新 |
| POST /controller/files/chat-export | files.exportChat | 聊天导出 |
| POST /controller/files/change-access-rights-file | files.changeAccessRightsForFile | 文件权限变更 |
| POST /controller/files/change-access-rights-folder | files.changeAccessRightsForFolder | 文件夹权限变更 |

### 6.2 健康检查API

| API端点 | 方法 | 说明 |
|---------|------|------|
| GET /health | GET | 返回 {status: "Healthy"} |

---

## 7. Room 房间模型

### 7.1 Room命名规则

```
普通房间: {tenantId}-{roomPart}
示例: 12345-DIR-abc123 (租户12345的目录abc123)

通用房间: {roomPart} (所有租户共享)
示例: storage-encryption, restore, backup
```

### 7.2 Room类型列表

| Room标识 | 说明 | 通用房间 |
|----------|------|----------|
| DIR-{folderId} | 文件夹目录 | 否 |
| FILE-{fileId} | 文件 | 否 |
| {tenantId}-backup | 租户备份 | 否 |
| backup | 全局备份 | 是 |
| {tenantId}-restore | 租户恢复 | 否 |
| restore | 全局恢复 | 是 |
| storage-encryption | 存储加密 | 是 |
| {tenantId}-change-my-type-{userId} | 用户类型变更 | 否 |
| {tenantId}-users | 用户管理 | 否 |
| {tenantId}-groups | 用户组管理 | 否 |
| {tenantId}-guests-{roomId} | 访客管理 | 否 |
| {tenantId}-telegram | Telegram集成 | 否 |
| {tenantId}-telegram-{userId} | Telegram用户 | 否 |

### 7.3 个体订阅 (individual)

当 individual=true 时，客户端会订阅 `{roomPart}-{userId}` 或 `{roomPart}-{linkId}` 格式的房间，实现针对特定用户的个性化通知。

---

## 8. 服务间调用关系

### 8.1 Socket.IO 服务调用后端API

Socket.IO 服务通过 axios 调用后端 .NET/Java API：

```
ASC.Socket.IO
    │
    ├── GET  /api/2.0/people/@self?fields=id,userName,displayName,isAdmin,isOwner
    │       获取当前用户信息
    │
    ├── GET  /api/2.0/portal?fields=tenantId,tenantDomain
    │       获取Portal租户信息
    │
    └── GET  /api/2.0/files/share/{share}
            验证分享链接
```

### 8.2 后端服务调用 Socket.IO

后端服务通过 HTTP POST 调用 Socket.IO 的 Controller API：

```
ASC.Web.Api / ASC.People / 其他后端服务
    │
    └── HTTP POST http://socket.io:9899/controller/files/*
            │
            ├── {room, fileId, data, userIds, ...}
            │   触发对应的 Socket.IO 事件
            │
            ▼
        Socket.IO 推送到订阅的客户端
```

---

## 9. 消息流程示例

### 9.1 文件创建并通知

```
1. 后端服务创建文件
2. 后端服务调用:
   POST http://socket.io:9899/controller/files/create-file
   Body: {
     id: "file123",
     room: "12345-DIR-folder456",
     data: {...},
     userIds: ["user1", "user2"]
   }
3. Socket.IO 处理:
   - 如果指定 userIds，对每个用户发送到 {room}-{userId}
   - 否则发送到 room 内的所有客户端
4. 客户端接收 s:modify-folder 事件
```

### 9.2 客户端订阅房间

```
1. 客户端连接 Socket.IO
2. 认证成功后，客户端发送:
   socket.emit("subscribe", {
     roomParts: ["DIR-folder123", "FILE-file456"],
     individual: true
   })
3. 服务端处理:
   - 订阅 {tenantId}-DIR-folder123
   - 订阅 {tenantId}-FILE-file456
   - 如果 individual=true，还订阅:
     - {tenantId}-DIR-folder123-{userId}
     - {tenantId}-FILE-file456-{userId}
     - {tenantId}-DIR-folder123-{linkId} (如果是分享链接)
```

---

## 10. Redis 集成

### 10.1 Redis 用法

- **Session存储**: 使用 connect-redis 存储 Express Session
- **Socket.IO Adapter**: 使用 @socket.io/redis-adapter 实现多实例消息同步

### 10.2 Redis Adapter 作用

当部署多个 Socket.IO 实例时，Redis Adapter 确保:
1. 消息在所有实例间同步
2. Socket.IO 的 Room 概念在集群间共享
3. 客户端连接断开时正确处理

---

## 11. 日志配置

### 11.1 日志输出

- **文件日志**: `Logs/socket-io.%DATE%.log` (Winston DailyRotateFile)
  - 路径可配置 via logPath
  - 保留30天，单文件最大50MB

- **CloudWatch**: 可选，配置 aws.cloudWatch
  - 需要配置 accessKeyId, secretAccessKey, region, logGroupName

- **Console**: 可选，配置 logConsole=true

### 11.2 日志格式

```json
{
  "date": "2025-01-01 12:00:00",
  "level": "INFO",
  "applicationContext": "SocketIO",
  "instance-id": "hostname",
  "message": "..."
}
```

---

## 12. 错误处理

### 12.1 全局异常处理

```javascript
process.on('unhandledRejection', (reason, p) => {
  winston.error('Unhandled rejection at:', p, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  winston.error(`Unhandled exception: ${error}\n` + `Exception origin: ${error.stack}`);
});
```

### 12.2 认证失败处理

认证失败时调用 `socket.disconnect("Unauthorized")`，客户端会收到 disconnect 事件。

---

## 13. 环境变量配置

通过 config/index.js 加载:

| 配置项 | 来源 | 说明 |
|--------|------|------|
| app.port | config.json | 服务端口 |
| app.appsettings | config.json | appsettings路径 |
| app.environment | config.json | 环境 (Development/Production) |
| Redis | appsettings.*.json | Redis连接配置 |
| core.machinekey | appsettings.*.json | Token验证密钥 |
| logPath | appsettings.*.json | 日志路径 |
| logLevel | appsettings.*.json | 日志级别 |
| logConsole | appsettings.*.json | 是否输出Console |
| API_HOST | appsettings.*.json | 后端API地址 |
| aws.cloudWatch | appsettings.*.json | CloudWatch配置 |

---

## 14. 配置加载优先级

### 14.1 nconf 配置加载机制

ASC.Socket.IO 使用 `nconf` 库管理配置。nconf 的核心规则是：**后加载的配置覆盖先加载的配置**。

### 14.2 config/index.js 配置加载顺序

```javascript
nconf.argv()           // 1. 命令行参数
    .env()             // 2. 环境变量
    .file("config", path.join(__dirname, 'config.json'));  // 3. config.json 文件
```

**实际优先级（从低到高）**：
1. config.json 文件 - **最低优先级**
2. 环境变量 (env)
3. 命令行参数 (argv) - **最高优先级**

### 14.3 实际配置加载逻辑

由于 nconf 默认不会覆盖已存在的配置，代码中 `getAndSaveAppsettings()` 函数手动解析 `process.argv` 来获取 `--app.appsettings` 和 `--app.environment` 的值：

```javascript
// 手动解析命令行参数
process.argv.forEach(arg => {
    if(arg.startsWith('--app.appsettings=')){
        argvArgs.appsettings = arg.split('=')[1];
    }
    if(arg.startsWith('--app.environment=')){
        argvArgs.environment = arg.split('=')[1];
    }
});

// 空字符串值回退到 config.json
var appsettings = (argvArgs.appsettings !== undefined && argvArgs.appsettings !== '')
    ? argvArgs.appsettings
    : configFromFile.app.appsettings;
```

### 14.4 appsettings 加载顺序

在 `getAndSaveAppsettings()` 函数中，按以下顺序加载配置文件（后面的覆盖前面的）：

```javascript
nconf.file("appsettingsWithEnv", path.join(appsettings, 'appsettings.' + env + '.json'));
nconf.file("appsettings", path.join(appsettings, 'appsettings.json'));
nconf.file("appsettingsServices", path.join(appsettings, 'appsettings.services.json'));
nconf.file("redisWithEnv", path.join(appsettings, 'redis.' + env + '.json'));
nconf.file("redis", path.join(appsettings, 'redis.json'));
```

**appsettings 优先级（从低到高）**：
1. `appsettings.{environment}.json` - 环境特定配置
2. `appsettings.json` - 主配置
3. `appsettings.services.json` - 服务特定配置
4. `redis.{environment}.json` - 环境特定 Redis 配置
5. `redis.json` - Redis 配置

### 14.5 Supervisor 配置与环境变量的关系

Supervisor 启动服务时传入的参数：

```
--app.appsettings=%(ENV_PATH_TO_CONF)s  # 来自环境变量 PATH_TO_CONF
--app.environment=%(ENV_INSTALLATION_TYPE)s  # 来自环境变量 INSTALLATION_TYPE
```

**容器环境变量**：
- `PATH_TO_CONF=/app/onlyoffice/config` - 指向配置目录
- `INSTALLATION_TYPE=""` - 空字符串

### 14.6 配置文件路径验证

Supervisor 传递的是**目录路径**而非文件路径：
- `PATH_TO_CONF=/app/onlyoffice/config` → 目录
- `--app.appsettings=/app/onlyoffice/config` → 目录

代码会自动拼接：`/app/onlyoffice/config/appsettings.json`

---

## 15. 常见配置问题排查

### 15.1 问题诊断表

| 问题现象 | 原因 | 解决方案 |
|----------|------|----------|
| `config.get("aws")` 返回 undefined | `app.appsettings` 指向的路径不存在 | 确保 `--app.appsettings` 指向正确目录 |
| `environment` 为空字符串 | `INSTALLATION_TYPE` 环境变量为空字符串 | 代码会回退到 config.json 的值 |
| Supervisor FATAL 但手动启动成功 | startsecs=25 未满足或进程启动后立即退出 | 检查日志输出，确保服务稳定运行超过25秒 |
| 502 Bad Gateway | Socket.IO 服务未运行 | 检查服务状态和端口监听 |
| 前端 WebSocket 报错 | 服务未启动或 nginx 配置错误 | 验证服务运行状态和反向代理配置 |

### 15.2 验证服务状态

```bash
# 检查端口监听
ss -tlnp | grep 9899

# 检查 Supervisor 状态
supervisorctl status ASC.Socket.IO

# 查看 Supervisor 日志
supervisorctl tail ASC.Socket.IO
```

### 15.3 手动启动服务验证

```bash
cd /var/www/services/ASC.Socket.IO
INSTALLATION_TYPE= PATH_TO_CONF=/app/onlyoffice/config \
node server.js --app.port=9899 --app.appsettings=/app/onlyoffice/config --app.environment=
```

---

## 16. 问题修复记录

### 16.1 ASC.Socket.IO 和 ASC.SsoAuth 服务 FATAL 问题

**问题描述**：
- ASC.Socket.IO 和 ASC.SsoAuth 服务处于 FATAL 状态
- 错误日志：`Cannot read properties of undefined (reading 'cloudWatch')`
- 服务启动后立即退出，无法保持运行

**根本原因**：
1. **配置路径错误**：Supervisor 配置中 `PATH_TO_CONF="/app/onlyoffice/config/appsettings.json"` 是**文件路径**，但 Node.js 服务期望的是**目录路径**
2. **端口绑定缺失**：ASC.Socket.IO 和 ASC.SsoAuth 缺少 `--app.host=0.0.0.0` 参数，导致服务只监听 localhost，无法被其他容器访问

**问题分析**：
- 配置文件路径：`/app/onlyoffice/config/appsettings.json`（文件）
- 代码期望路径：`/app/onlyoffice/config`（目录）
- nconf 配置加载器会自动拼接：`/app/onlyoffice/config/appsettings.json`
- 当传入文件路径时，代码再次拼接导致路径不存在

**修复过程**：

1. **诊断问题**
```bash
# 检查服务状态
docker exec onlyoffice-node-services supervisorctl status

# 查看错误日志
docker exec onlyoffice-node-services cat /var/log/supervisor/ASC.Socket.IO-stderr---supervisor-*.log
```

2. **修复 Supervisor 配置**
```bash
# 进入容器修改配置
docker exec -it onlyoffice-node-services /bin/bash

# 修复 PATH_TO_CONF（文件路径改为目录路径）
sed -i 's|PATH_TO_CONF="/app/onlyoffice/config/appsettings.json"|PATH_TO_CONF="/app/onlyoffice/config"|g' /etc/supervisor/conf.d/supervisord.conf

# 给 ASC.Socket.IO 添加 --app.host=0.0.0.0
sed -i 's|command=/usr/local/bin/node server.js --app.port=%(ENV_SERVICE_SOCKET_PORT)s --app.appsettings|command=/usr/local/bin/node server.js --app.port=%(ENV_SERVICE_SOCKET_PORT)s --app.host=0.0.0.0 --app.appsettings|g' /etc/supervisor/conf.d/supervisord.conf

# 给 ASC.SsoAuth 添加 --app.host=0.0.0.0
sed -i 's|command=/usr/local/bin/node app.js --app.port=%(ENV_SERVICE_SSOAUTH_PORT)s --app.appsettings|command=/usr/local/bin/node app.js --app.port=%(ENV_SERVICE_SSOAUTH_PORT)s --app.host=0.0.0.0 --app.appsettings|g' /etc/supervisor/conf.d/supervisord.conf
```

3. **验证修改结果**
```bash
# 确认配置已修改
docker exec onlyoffice-node-services grep "PATH_TO_CONF" /etc/supervisor/conf.d/supervisord.conf
docker exec onlyoffice-node-services grep -A1 "ASC.Socket.IO" /etc/supervisor/conf.d/supervisord.conf
docker exec onlyoffice-node-services grep -A1 "ASC.SsoAuth" /etc/supervisor/conf.d/supervisord.conf
```

4. **重新加载 Supervisor 配置**
```bash
docker exec onlyoffice-node-services supervisorctl reread
docker exec onlyoffice-node-services supervisorctl update
```

5. **验证服务状态**
```bash
# 等待服务启动
sleep 30

# 检查所有服务状态
docker exec onlyoffice-node-services supervisorctl status
```

**修复后配置对比**：

| 配置项 | 修复前 | 修复后 |
|--------|--------|--------|
| PATH_TO_CONF | `/app/onlyoffice/config/appsettings.json` | `/app/onlyoffice/config` |
| ASC.Socket.IO command | `--app.port=9899 --app.appsettings` | `--app.port=9899 --app.host=0.0.0.0 --app.appsettings` |
| ASC.SsoAuth command | `--app.port=9834 --app.appsettings` | `--app.port=9834 --app.host=0.0.0.0 --app.appsettings` |

**修复结果**：
- ✅ ASC.Socket.IO: RUNNING
- ✅ ASC.SsoAuth: RUNNING
- ✅ onlyoffice-node-services 容器: healthy

**经验总结**：
1. Node.js 服务的 `--app.appsettings` 参数应传递**目录路径**而非文件路径
2. 服务需要显式指定 `--app.host=0.0.0.0` 才能接受外部连接
3. Supervisor 配置修改后需要 `reread` 和 `update` 才能生效

---

## 17. 关键代码位置

| 文件 | 作用 |
|------|------|
| `server.js` | 服务入口，启动流程控制 |
| `config/index.js` | nconf 配置加载，`getAndSaveAppsettings()` 函数 |
| `app/log.js` | Winston 日志配置，CloudWatch 集成 |
| `app/hubs/files.js` | Socket.IO 事件处理核心逻辑 |
| `app/middleware/auth.js` | Socket 连接认证中间件 |
| `app/middleware/authService.js` | Token 验证服务 |
