# Router 架构文档

## 1. Router 概述

Router 容器运行 Nginx（OpenResty），作为整个 DocSpace 系统的反向代理入口，负责将请求路由到不同的后端服务。

### 1.1 容器信息

- 容器名称: `onlyoffice-router`
- 镜像: `onlyoffice/docspace-router:latest`
- 入口端口: 8092
- API端口: 8081

### 1.2 配置文件结构

Router 的 Nginx 配置由多个文件组成：

| 配置文件 | 用途 |
|----------|------|
| `/etc/nginx/conf.d/onlyoffice.conf` | 主配置文件，包含主要路由规则 |
| `/etc/nginx/conf.d/upstream.conf` | upstream 定义和变量映射 |
| `/etc/nginx/conf.d/onlyoffice-client.conf` | 客户端静态文件服务 (端口5001) |
| `/etc/nginx/conf.d/onlyoffice-login.conf` | 登录静态文件服务 (端口5011) |
| `/etc/nginx/conf.d/onlyoffice-management.conf` | 管理后台静态文件服务 (端口5015) |
| `/etc/nginx/conf.d/default.conf` | 默认配置 |

## 2. 端口映射

### 2.1 对外端口

| 端口 | 用途 |
|------|------|
| 8092 | 主入口，前端应用访问 |
| 8081 | API入口，后端服务访问 |

### 2.2 内部端口

| 端口 | 服务 |
|------|------|
| 5001 | 客户端静态文件 |
| 5011 | 登录静态文件 |
| 5015 | 管理后台静态文件 |

## 3. 路由规则

### 3.1 Upstream 定义

upstream.conf 文件定义了所有后端服务的地址映射：

```nginx
# Node.js 服务
map onlyoffice-node-services:5011 $service_login      # 登录服务
map onlyoffice-node-services:5013 $service_doceditor # 文档编辑器
map onlyoffice-node-services:5099 $service_sdk       # SDK服务
map onlyoffice-node-services:5015 $service_management # 管理服务
map onlyoffice-node-services:9899 $service_socket    # Socket.IO
map onlyoffice-node-services:9834 $service_sso      # SSO认证

# .NET 服务
map onlyoffice-dotnet-services:5000 $service_api           # 主API
map onlyoffice-dotnet-services:5003 $service_studio        # Studio
map onlyoffice-dotnet-services:5004 $service_people_server # 人员服务
map onlyoffice-dotnet-services:5007 $service_files         # 文件服务
map onlyoffice-dotnet-services:5010 $service_api_system    # API系统
map onlyoffice-dotnet-services:5012 $service_backup        # 备份服务
map onlyoffice-dotnet-services:5033 $service_healthchecks   # 健康检查
map onlyoffice-dotnet-services:5157 $service_ai            # AI服务

# Java 服务
map onlyoffice-java-services:8080 $service_identity     # 身份服务
map onlyoffice-java-services:9090 $service_identity_api # 身份API
map onlyoffice-java-services:5100 $service_apicache     # API缓存服务
```

### 3.2 路由规则表

| 路径模式 | 目标服务 | 后端端口 | 说明 |
|----------|----------|----------|------|
| `/ds-vpath/*` | Document Server | 80 | 文档预览服务 |
| `/client/*` | 客户端静态 | 5001 | 静态文件服务 |
| `/sdk/*` | ASC.Sdk | 5099 | SDK服务 |
| `/doceditor/*` | ASC.Editors | 5013 | 文档编辑器 |
| `/login/*` | ASC.Login | 5011 | 登录服务 |
| `/management/*` | ASC.Management | 5015 | 管理后台 |
| `/api/2.0/*` | .NET API | 5000 | 主API服务 |
| `/apisystem/*` | ASC.ApiSystem | 5010 | API系统 |
| `/people/*` | ASC.People | 5004 | 人员服务 |
| `/files/*` | ASC.Files | 5007 | 文件服务 |
| `/backup/*` | ASC.Backup | 5012 | 备份服务 |
| `/studio/*` | ASC.Studio | 5003 | 工作室 |
| `/socket.io/*` | ASC.Socket.IO | 9899 | WebSocket |
| `/identity/*` | Java Identity | 8080 | 身份服务 |
| `/sso/*` | ASC.SsoAuth | 9834 | SSO认证 |
| `/healthchecks/*` | 健康检查 | 5033 | 健康检查端点 |
| `/ai/*` | ASC.AI | 5157 | AI服务 |
| `/apicache/*` | API Cache | 5100 | API缓存服务 |

### 3.3 详细路由配置

#### 主入口配置 (8092端口)

主server块处理所有到8092端口的请求：

```nginx
server {
    listen 8092;
    root /var/www/public/;
    # ... 其他配置
}
```

#### 登录路由 (/login)

```nginx
location /login {
    proxy_pass http://$service_login;
}
```

#### API路由 (/api/2.0)

```nginx
location /api/2.0 {
    proxy_pass http://$service_api;
}
```

#### 文档编辑器路由 (/doceditor)

```nginx
location /doceditor {
    proxy_pass http://$service_doceditor;
}
```

#### Socket.IO路由

```nginx
location /socket.io {
    proxy_pass http://$service_socket;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

#### API Cache路由 (/apicache)

```nginx
location /apicache {
    rewrite apicache/(.*) /$1  break;
    proxy_pass http://onlyoffice-java-services:5100;
}
```

## 4. 已知问题

### 4.1 Node.js 服务监听地址问题

**问题描述**：Router 将请求代理到 Node.js 服务（如 ASC.Login），但由于 Node.js 服务只监听容器内部IP，未监听 `127.0.0.1` 或 `0.0.0.0`，导致代理连接失败。

**现象**：
- 访问 `/login` 时返回 502 Bad Gateway 或 504 Gateway Timeout
- Nginx 错误日志：`connect() failed (111: Connection refused)`

**受影响的路由**：
- `/login/*` → ASC.Login (5011)
- `/doceditor/*` → ASC.Editors (5013)
- `/management/*` → ASC.Management (5015)
- `/sdk/*` → ASC.Sdk (5099)
- `/socket.io/*` → ASC.Socket.IO (9899)
- `/sso/*` → ASC.SsoAuth (9834)

**根本原因**：Node.js 服务启动时只监听容器内部IP，未监听 `0.0.0.0`

## 5. 排查命令

### 5.1 查看 Nginx 配置

```bash
# 主配置文件
docker exec onlyoffice-router cat /etc/nginx/conf.d/onlyoffice.conf

# upstream 配置
docker exec onlyoffice-router cat /etc/nginx/conf.d/upstream.conf

# 客户端配置
docker exec onlyoffice-router cat /etc/nginx/conf.d/onlyoffice-client.conf
```

### 5.2 测试路由

```bash
# 测试主入口
curl -I http://localhost:8092/

# 测试 API
curl -I http://localhost:8092/api/2.0/settings/colortheme

# 测试登录路由
curl -I http://localhost:8092/login
```

### 5.3 查看错误日志

```bash
docker exec onlyoffice-router tail -f /var/log/nginx/error.log
```

### 5.4 验证配置

```bash
docker exec onlyoffice-router nginx -t
```

## 6. 相关文件路径

- 主配置: `/etc/nginx/conf.d/onlyoffice.conf`
- Upstream: `/etc/nginx/conf.d/upstream.conf`
- 客户端配置: `/etc/nginx/conf.d/onlyoffice-client.conf`
- 登录配置: `/etc/nginx/conf.d/onlyoffice-login.conf`
- 管理配置: `/etc/nginx/conf.d/onlyoffice-management.conf`
- 静态文件: `/var/www/public/` (主入口)
- 客户端文件: `/var/www/client/` (5001端口)
- 登录文件: `/var/www/login/` (5011端口)
- 管理文件: `/var/www/management/` (5015端口)
