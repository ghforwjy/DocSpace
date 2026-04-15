# ISSUE-013-文件内容与扩展名不匹配

## 问题基本信息

| 项目 | 内容 |
|------|------|
| 问题编号 | ISSUE-013 |
| 发现时间 | 2026-04-14 |
| 问题类型 | 文档服务配置问题 |
| 问题状态 | ✅ **已解决** |

## 问题描述

### 错误信息

```
ONLYOFFICE Document Editor reports an error: code -85, description 打开文件时出错<br>文件内容与扩展名不匹配。
```

---

## 问题根源

### nginx `/cache` 路由配置错误

**错误配置**：
```nginx
location ~* ^/cache/ {
    proxy_pass http://onlyoffice-node-services:5009;  # ❌ 错误！
}
```

**问题分析**：
1. nginx `/cache` 路由指向 `onlyoffice-node-services:5009`
2. **node-services 不监听 5009 端口**
3. 导致 `Connection refused`，nginx 返回 500 Error HTML
4. DocumentServer 收到 HTML 而不是二进制文件
5. 报错：文件内容与扩展名不匹配

---

## 修复方案

### 修改 nginx 配置

将 `/cache` 路由指向正确的服务 **DocumentServer (端口 80)**：

```nginx
location ~* ^/cache/ {
    proxy_pass http://onlyoffice-document-server:80;
    proxy_redirect off;
}
```

### 修复步骤

1. 删除错误的 `/cache` 路由配置
2. 添加正确的 `/cache` 路由，指向 `onlyoffice-document-server:80`

---

## 服务端口配置（已确认）

### node-services (172.18.0.4)

| 端口 | 服务名称 | 功能 | 备注 |
|------|----------|------|------|
| 5011 | ASC.Login | 登录服务 | Node.js 前端服务 |
| 5013 | ASC.Editors | 文档编辑器前端 | doceditor 应用 |
| 5015 | ASC.Management | 管理服务 | 管理界面 |
| 5099 | ASC.Sdk | SDK 服务 | 提供 SDK 相关功能 |
| 9834 | ASC.SsoAuth | SSO 认证服务 | SSO 单点登录 |
| 9899 | ASC.Socket.IO | WebSocket 服务 | 实时通信 |
| **5009** | ❌ **无服务** | - | 不存在此端口 |

### dotnet-services (172.18.0.5)

| 端口 | 服务名称 | 功能 | 备注 |
|------|----------|------|------|
| 5000 | ASC.Api | API 服务 | 主 API 入口 |
| 5004 | ASC.People | 人员服务 | 用户管理 |
| 5007 | ASC.Files | 文件服务 | **主文件服务，有 FileHandler** |
| 5009 | ASC.Files.Service | 文件服务后端 | 后端处理，无 FileHandler |
| 5012 | ASC.Data.Backup | 备份服务 | 数据备份 |
| 5033 | ASC.HealthChecks | 健康检查 | 服务健康检查 |

### java-services (172.18.0.7)

| 端口 | 服务名称 | 功能 | 备注 |
|------|----------|------|------|
| 8080 | ASC.Identity.Authorization | 授权服务 | Java Spring Boot |
| 9090 | ASC.Identity.Registration | 注册服务 | Java Spring Boot |

### document-server (172.18.0.5)

| 端口 | 服务名称 | 功能 | 备注 |
|------|----------|------|------|
| 80 | DocumentServer | 文档编辑服务 | Node.js Express 应用 |

---

## /cache 缓存机制分析

### DocumentServer service worker 中的 /cache

根据 `document_editor_service_worker.js`：

```javascript
const g_fifoPrefix = 'cache/files/data/';
const g_fifoDocIdParams = ['shardkey', 'WOPISrc'];
```

**`/cache/files/data/` 是 DocumentServer service worker 的客户端缓存路径**。

### 工作原理

1. **DocumentServer 的 service worker 拦截请求**
   - 匹配 `/cache/files/data/` URL 模式

2. **缓存策略**
   - FIFO 缓存，用于动态文档文件
   - 最大 3 个 unique docids
   - 每个文件最大 500 MB
   - DocId TTL: 10 分钟

3. **缓存流程**
   ```
   请求 → Service Worker → 检查缓存
                            ├── 命中 → 返回缓存文件
                            └── 未命中 → 从网络获取 → 缓存 → 返回
   ```

---

## 排查时间线

| 时间 | 发现/操作 |
|------|----------|
| 2026-04-14 08:40 | 首次发现错误 |
| 2026-04-14 13:08 | 发现 DocumentServer 访问 FileHandler 返回 403 |
| 2026-04-14 13:15 | 发现 JWT 密钥不一致 |
| 2026-04-14 15:30 | 修复 JWT 密钥一致性 |
| 2026-04-14 15:40 | 添加 docx 到 downloadFileAllowExt |
| 2026-04-15 05:40 | 发现 /cache 路由返回 HTML 问题 |
| 2026-04-15 06:30 | 确认 nginx /cache 路由指向错误的服务 |
| 2026-04-15 07:00 | 分析 ASC.Files.Service 工作原理 |
| 2026-04-15 07:30 | 确认 /cache 路由不是 buildtools 原始配置 |
| 2026-04-15 08:00 | 分析 DocumentServer service worker 中的 /cache 用途 |
| 2026-04-15 08:30 | 发现 java-services 实际监听 8080/9090 |
| 2026-04-15 09:00 | 确认 /cache 应该由 DocumentServer (端口 80) 处理 |
| 2026-04-15 09:15 | 修改 nginx /cache 路由配置 |
| 2026-04-15 09:20 | **端到端测试成功！编辑器正常打开！** |

---

## 验证结果

### 修复前

```
[ERROR] code -85, description 打开文件时出错<br>文件内容与扩展名不匹配。
```

### 修复后

```
[LOG] ONLYOFFICE Document Editor is ready
[LOG] ONLYOFFICE Document Editor is opened in mode edit
```

**编辑器成功打开，没有错误！**

---

## 修复命令

```bash
# 备份 nginx 配置
docker exec onlyoffice-router cp /etc/nginx/conf.d/onlyoffice.conf /etc/nginx/conf.d/onlyoffice.conf.bak-20260415

# 添加正确的 /cache 路由
docker exec onlyoffice-router sed -i '/location \/ {/a\        location ~* ^/cache/ {\n                proxy_pass http://onlyoffice-document-server:80;\n                proxy_redirect off;\n        }\n' /etc/nginx/conf.d/onlyoffice.conf

# 测试配置
docker exec onlyoffice-router nginx -t

# 重新加载 nginx
docker exec onlyoffice-router nginx -s reload
```

---

## 后续观察

1. 浏览器控制台显示 `ONLYOFFICE Document Editor is ready` 和 `opened in mode edit`
2. 截图大小从 48KB 增加到 133KB，内容更丰富
3. 未出现 "文件内容与扩展名不匹配" 错误

### 仍存在的控制台错误（不影响功能）

```
[ERROR] Failed to load resource: 404 (Not Found) - 插件资源
TypeError: Cannot set properties of undefined (setting 'save') - 插件本地存储
TypeError: AI.loadResourceAsText is not a function - AI 插件
```

这些是插件相关的错误，与核心文档编辑功能无关。

---

## 总结

### 问题根源

nginx 配置中 `/cache` 路由指向了不存在服务的端口（`onlyoffice-node-services:5009`），导致 DocumentServer 无法下载文件。

### 解决方案

将 `/cache` 路由指向正确的服务（`onlyoffice-document-server:80`）。

### 关键发现

1. **`/cache` 是 DocumentServer service worker 的客户端缓存路径**
2. **`/cache` 请求应该由 DocumentServer server 端处理（端口 80）**
3. **nginx 配置中 `/cache` 路由是部署时错误添加的**
4. **buildtools 原始配置中没有 `/cache` 路由**
