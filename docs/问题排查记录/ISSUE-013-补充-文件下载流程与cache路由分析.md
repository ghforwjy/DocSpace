# ISSUE-013 文件下载流程与 /cache 路由分析

## 1. 问题概述

### 问题描述

```
ONLYOFFICE Document Editor reports an error: code -85, description 打开文件时出错<br>文件内容与扩展名不匹配。
```

### 问题状态

✅ **已解决** (2026-04-15)

---

## 2. DocumentServer 文件下载完整流程

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           文件下载完整流程                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DocSpace 后端生成编辑器配置                                              │
│     └── document.url = "/FileHandler.ashx?action=stream&fileId=..."         │
│                                                                              │
│  2. DocumentServer 客户端接收配置                                            │
│     └── 解析配置，获取 document.url                                          │
│                                                                              │
│  3. DocumentServer service worker 拦截文件请求                               │
│     └── 匹配 /cache/files/data/ URL 模式                                    │
│                                                                              │
│  4. 缓存命中检查                                                             │
│     ├── 命中 → 返回缓存的二进制文件                                          │
│     └── 未命中 → 从网络获取                                                  │
│                                                                              │
│  5. 未命中时，从 document.url 下载文件                                       │
│     └── 请求 /FileHandler.ashx?action=stream&fileId=...                     │
│     └── nginx 路由到 dotnet-services:5007                                  │
│     └── ASC.Files.FileHandler 处理请求                                      │
│     └── 从存储服务获取文件并返回                                             │
│                                                                              │
│  6. 文件缓存到 service worker                                                │
│     └── 返回文件给 DocumentServer                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 /cache 路由的作用

**`/cache/files/data/` 是 DocumentServer service worker 的客户端缓存路径**，用于浏览器端缓存动态文档文件。

**来源**：DocumentServer SDK 的 service worker 代码中定义：

```javascript
// document_editor_service_worker.js
const g_fifoPrefix = 'cache/files/data/';
const g_fifoDocIdParams = ['shardkey', 'WOPISrc'];
```

### 2.3 缓存策略

| 参数 | 值 | 说明 |
|------|-----|------|
| `g_fifoCachePrefix` | `document_editor_dynamic_` | 缓存名称前缀 |
| `maxDocIds` | 3 | 最大缓存的 unique docids |
| `maxEntrySize` | 500 MB | 单个文件最大缓存大小 |
| `docIdTTL` | 10 分钟 | docid 过期时间 |

### 2.4 文件下载流程（cache miss 时）

```
浏览器请求 /cache/files/data/{shardkey}/Editor.bin?md5=...&expires=...
    ↓
Service Worker 拦截请求
    ↓
检查 FIFO 缓存 → 未命中
    ↓
从网络获取（fetch）
    ↓
DocumentServer 客户端请求 /FileHandler.ashx?action=stream&fileId=...
    ↓
nginx 路由：/files/* → dotnet-services:5007
    ↓
ASC.Files.FileHandler 处理
    ↓
从存储获取文件流
    ↓
返回文件给浏览器
    ↓
Service Worker 缓存文件
    ↓
返回文件给 DocumentServer
```

---

## 3. nginx /cache 路由配置

### 3.1 问题发现

**错误配置**：
```nginx
location ~* ^/cache/ {
    proxy_pass http://onlyoffice-node-services:5009;  # ❌ 错误！
}
```

**问题分析**：
1. nginx `/cache` 路由指向 `onlyoffice-node-services:5009`
2. **node-services 不监听 5009 端口**（实际监听 5011, 5013, 5015, 5099, 9834, 9899）
3. 导致 `Connection refused`，nginx 返回 500 Error HTML
4. DocumentServer 收到 HTML 而不是二进制文件

### 3.2 正确配置

```nginx
location ~* ^/cache/ {
    proxy_pass http://onlyoffice-document-server:80;
    proxy_redirect off;
}
```

**原因**：
- `/cache` 请求应该由 DocumentServer server 端处理
- DocumentServer 监听端口 80

---

## 4. 服务端口配置（已确认）

### 4.1 node-services (172.18.0.4)

| 端口 | 服务名称 | 功能 | 备注 |
|------|----------|------|------|
| 5011 | ASC.Login | 登录服务 | Node.js 前端服务 |
| 5013 | ASC.Editors | 文档编辑器前端 | doceditor 应用 |
| 5015 | ASC.Management | 管理服务 | 管理界面 |
| 5099 | ASC.Sdk | SDK 服务 | 提供 SDK 相关功能 |
| 9834 | ASC.SsoAuth | SSO 认证服务 | SSO 单点登录 |
| 9899 | ASC.Socket.IO | WebSocket 服务 | 实时通信 |
| **5009** | ❌ **无服务** | - | nginx 错误指向此处 |

**重要**：node-services **不监听 5009 端口**！

### 4.2 dotnet-services (172.18.0.5)

| 端口 | 服务名称 | 功能 | 备注 |
|------|----------|------|------|
| 5000 | ASC.Api | API 服务 | 主 API 入口 |
| 5004 | ASC.People | 人员服务 | 用户管理 |
| 5007 | ASC.Files | 文件服务 | **主文件服务，有 FileHandler** |
| 5009 | ASC.Files.Service | 文件服务后端 | 后端处理（队列、事件），无 FileHandler |
| 5012 | ASC.Data.Backup | 备份服务 | 数据备份 |
| 5033 | ASC.HealthChecks | 健康检查 | 服务健康检查 |

### 4.3 ASC.Files 与 ASC.Files.Service 的区别

| 服务 | 端口 | 功能 | FileHandler |
|------|------|------|-------------|
| ASC.Files | 5007 | 主文件服务 | ✅ 有 `/FileHandler.ashx` |
| ASC.Files.Service | 5009 | 后端处理（队列、事件） | ❌ 无 FileHandler |

---

## 5. FileHandler 处理逻辑

### 5.1 FileHandler.ashx.cs

**路径**：`server/products/ASC.Files/Core/HttpHandlers/FileHandler.ashx.cs`

**action=stream 处理流程**：

```csharp
case "stream":
    await StreamFile(context);
    break;

private async Task StreamFile(HttpContext context)
{
    // 1. 解析 fileId 和 authKey 参数
    // 2. 验证 authKey
    // 3. 从存储获取文件流
    // 4. 返回文件内容
}
```

### 5.2 URL 生成 (PathProvider)

**路径**：`server/products/ASC.Files/Core/Helpers/PathProvider.cs`

```csharp
public static string GetFileStreamUrl(T fileId, bool isCollab = false)
{
    var uri = new Uri(FileHandlerPath);
    var query = $"action=stream&fileId={fileId}";
    // ...
    return $"{uri.PathAndQuery}&{query}";
}
```

**生成的 URL 格式**：
```
/FileHandler.ashx?action=stream&fileId={id}&version={version}&authKey={key}
```

---

## 6. 排查时间线

| 时间 | 发现/操作 |
|------|----------|
| 2026-04-14 08:40 | 首次发现错误 |
| 2026-04-15 05:40 | 发现 /cache 路由返回 HTML 问题 |
| 2026-04-15 06:30 | 确认 nginx /cache 路由指向错误的服务 |
| 2026-04-15 07:00 | 分析 ASC.Files.Service 工作原理 |
| 2026-04-15 07:30 | 确认 /cache 路由不是 buildtools 原始配置 |
| 2026-04-15 08:00 | 分析 DocumentServer service worker 中的 /cache 用途 |
| 2026-04-15 08:30 | 发现 java-services 实际监听 8080/9090，不是 5100 |
| 2026-04-15 09:00 | 确认 /cache 应该由 DocumentServer (端口 80) 处理 |
| 2026-04-15 09:15 | 修改 nginx /cache 路由配置 |
| 2026-04-15 09:20 | **端到端测试成功！编辑器正常打开！** |

---

## 7. 验证结果

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

## 8. 总结

### 问题根源

nginx 配置中 `/cache` 路由指向了不存在服务的端口（`onlyoffice-node-services:5009`），导致 DocumentServer 无法下载文件。

### 解决方案

将 `/cache` 路由指向正确的服务（`onlyoffice-document-server:80`）。

### 关键发现

1. **`/cache` 是 DocumentServer service worker 的客户端缓存路径**
2. **`/cache` 请求应该由 DocumentServer server 端处理（端口 80）**
3. **nginx 配置中 `/cache` 路由是部署时错误添加的**
4. **buildtools 原始配置中没有 `/cache` 路由**
5. **node-services 不监听 5009 端口**
