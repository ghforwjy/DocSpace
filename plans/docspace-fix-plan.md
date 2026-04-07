# DocSpace 问题修复计划

## 问题汇总

根据 `配置项检查.md` 分析，主要问题如下：

| 优先级 | 问题 | 原因 | 直接影响 |
|--------|------|------|----------|
| P0 | Java 服务无法连接 RabbitMQ | RABBIT_HOST 为空，Java 服务尝试连接 localhost:5672 | 用户认证/注册功能异常 |
| P0 | Document Server 核心服务未启动 | pluginsmanager 卡住，nginx/supervisor 未运行 | 文档编辑功能完全不可用 |
| P1 | 数据库表结构不匹配 | 迁移未完成或版本不一致 | 部分 API 功能异常 |
| P1 | Node.js Login fetch failed | Java 服务未正常运行导致 | 前端无法正常加载 |
| P2 | JWT/MachineKey 使用占位符 | 默认配置 | 安全性风险（仅测试环境） |

---

## 修复步骤

### Step 1: 修复 Java 服务 RabbitMQ 连接（P0）

**问题根因**：
- `.env` 文件中 `RABBIT_HOST=` 为空
- Java 服务尝试连接 `localhost:5672` 而非 `onlyoffice-rabbitmq:5672`

**修复方案**：
在 `.env` 文件中添加 `RABBIT_URI` 环境变量，或检查 `docspace-stack.yml` 中 Java 服务的环境变量配置。

**修复文件**：
- `e:\mycode\DocSpace\buildtools\install\docker\.env`

**验证方法**：
```bash
# 检查 Java 服务 RabbitMQ 连接状态
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker logs onlyoffice-java-services 2>&1 | grep -i rabbit"

# 确认连接建立
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-rabbitmq rabbitmqctl list_connections"
```

**预期结果**：
- Java 服务日志中不再出现 "Connection refused"
- `rabbitmqctl list_connections` 显示 172.18.0.7（Java服务）已连接

---

### Step 2: 修复 Document Server 启动问题（P0）

**问题根因**：
- pluginsmanager 进程卡住（CPU 99%）
- 启动脚本在等待某个条件时卡住
- nginx 和 supervisor 未运行

**修复方案**：
重启 Document Server 容器，如果问题依旧，检查启动日志。

**修复命令**：
```bash
# 重启 Document Server 容器
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker restart onlyoffice-document-server"

# 等待启动后检查状态
sleep 30

# 检查容器状态
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker ps | grep document-server"

# 检查健康状态
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker inspect onlyoffice-document-server --format '{{.State.Health.Status}}'"
```

**如果问题依旧，检查日志**：
```bash
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker logs onlyoffice-document-server --tail 200"
```

**预期结果**：
- Document Server 容器状态为 healthy
- nginx 和 supervisor 进程运行中
- HealthCheck 返回正常

---

### Step 3: 验证 Node.js Login 服务连接（P1）

**问题根因**：
- Node.js 服务无法连接到后端 API（可能是 Java 服务未正常运行导致）

**前置条件**：
- Step 1 已完成（Java 服务 RabbitMQ 连接修复）

**验证方法**：
```bash
# 检查 Node.js 服务日志
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker logs onlyoffice-node-services 2>&1 | grep -i error"

# 测试 Windows 宿主机访问
Invoke-WebRequest -Uri "http://localhost:8092" -UseBasicParsing -TimeoutSec 10
```

**预期结果**：
- Node.js 服务日志中不再出现 "fetch failed"
- http://localhost:8092 返回 200 状态码

---

### Step 4: 检查数据库迁移状态（P1）

**问题根因**：
- .NET 服务错误：`Unknown column 'w.last_modified' in 'field list'`
- 数据库表结构与代码期望不匹配

**修复方案**：
检查是否需要重新运行迁移。

**修复命令**：
```bash
# 查看迁移状态
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker compose -f db.yml -f redis.yml -f rabbitmq.yml ps"

# 检查 .NET 服务日志中的数据库错误
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker logs onlyoffice-dotnet-services 2>&1 | grep -i 'Unknown column'"
```

**如果需要重新运行迁移**：
```bash
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && docker compose -f migration-runner.yml run --rm onlyoffice-migration-runner"
```

---

### Step 5: 配置 JWT/MachineKey 生产密钥（P2）

**问题根因**：
- `APP_CORE_MACHINEKEY` 和 `DOCUMENT_SERVER_JWT_SECRET` 使用占位符
- 存在安全风险

**修复方案**：
生成并配置生产密钥。

**修复文件**：
- `e:\mycode\DocSpace\buildtools\install\docker\.env`

**修复步骤**：
```powershell
# 生成 MachineKey
$machineKey = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) | ForEach-Object { [byte]$_ })

# 生成 JWT Secret
$jwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) | ForEach-Object { [byte]$_ })

Write-Host "APP_CORE_MACHINEKEY=$machineKey"
Write-Host "DOCUMENT_SERVER_JWT_SECRET=$jwtSecret"
```

**预期结果**：
- .env 文件中的密钥不再是占位符

---

## 执行顺序

```
Step 1: Java 服务 RabbitMQ 连接（P0）
    │
    ▼
Step 3: 验证 Node.js Login 服务（P1）◄── 依赖 Step 1
    │
    ▼
Step 2: Document Server 启动（P0）◄── 可与 Step 1 并行执行
    │
    ▼
Step 4: 数据库迁移检查（P1）
    │
    ▼
Step 5: JWT/MachineKey 配置（P2）
```

**并行执行说明**：
- Step 1 和 Step 2 可并行执行（独立问题）
- Step 3 需等待 Step 1 完成后验证

---

## 验证检查点

每个 Step 完成后需要验证：
1. 相关服务容器状态为 healthy
2. 日志中无新的 error
3. Windows 宿主机可正常访问

---

## 回滚方案

如果修复失败：
1. 保留原 `.env` 文件备份
2. Document Server 可通过 `docker compose -f ds.yml down` 停止
3. 数据库迁移问题需重新导入数据库备份
