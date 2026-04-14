# 问题排查记录表

## 问题基本信息

| 项目 | 内容 |
|------|------|
| 问题编号 | ISSUE-001 |
| 发现时间 | 2026-04-14 |
| 问题类型 | 文档编辑器加载失败 |
| 问题状态 | ✅ 已解决 |

## 问题描述

### 错误信息
```
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
error load DocsAPI from http://onlyoffice-document-server:80
```

### 涉及页面
1. 文档服务配置页面：`http://43.135.17.107:8092/portal-settings/integration/document-service`
2. 在线文档打开页面：`http://43.135.17.107:8092/doceditor?fileId=1&action=edit`
3. 在线文档列表页面：`http://43.135.17.107:8092/rooms/personal/filter?folder=7&page=1&sortby=DateAndTime&sortorder=descending&date=1776150963894`

---

## 排查过程记录

### 阶段1：端到端测试发现并验证问题

| 步骤 | 操作 | 结果 |
|------|------|------|
| 1.1 | playwright-cli open 文档编辑器页面 | 页面加载，但控制台报错 |
| 1.2 | playwright-cli console | 发现 `ERR_NAME_NOT_RESOLVED` 错误 |
| 1.3 | playwright-cli screenshot | 截图保存问题证据 |

### 阶段2：代码追踪

| 步骤 | 文件 | 关键发现 |
|------|------|----------|
| 2.1 | page.tsx:L153 | `url = data.config?.editorUrl` |
| 2.2 | ConfigurationDto.cs:L486 | `EditorUrl = commonLinkUtility.GetFullAbsolutePath(filesLinkUtility.DocServiceApiUrl)` |
| 2.3 | FilesLinkUtility.cs:L162 | DocServiceApiUrl 从 FilesUrlKeys.Api 配置读取 |
| 2.4 | SetDocServiceUrlAsync | 将同一个URL保存到 Api 和 Public 两个key |

### 阶段3：配置验证

| 步骤 | 验证内容 | 结果 |
|------|----------|------|
| 3.1 | 查看当前配置 | `docServiceUrlApi` = `http://onlyoffice-document-server:80/...` |
| 3.2 | DocumentServer端口映射 | 容器内部80端口映射到宿主机8085 |
| 3.3 | Nginx路由检查 | 无 `/web-apps/` 路径的路由 |

### 阶段4：根因分析

**R1**: 配置中的 `docServiceUrl` 被设置为 `http://onlyoffice-document-server:80/`，这是Docker内部主机名，浏览器无法解析
**R2**: Nginx配置缺少对DocumentServer API路径的代理路由
**R3**: 后端 .NET 容器缓存了旧的配置，重启后才生效

---

## 最终解决方案

### 步骤1：添加 nginx /ds-api/ 路由

在 `/home/ubuntu/EasyDocs/DocSpace/buildtools/config/nginx/onlyoffice.conf` 中添加：

```nginx
location /ds-api/ {
    rewrite /ds-api/(.*) /$1 break;
    proxy_pass http://onlyoffice-document-server:80/;
    proxy_redirect off;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $proxy_connection;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $proxy_x_forwarded_proto;
    add_header Content-Security-Policy "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; script-src-elem * 'unsafe-inline'; img-src * data:; style-src * 'unsafe-inline' data:; font-src * data:; frame-src * ascdesktop:; object-src; connect-src * ascdesktop:;";
}
```

### 步骤2：部署nginx配置

```bash
docker cp /home/ubuntu/EasyDocs/DocSpace/buildtools/config/nginx/onlyoffice.conf onlyoffice-router:/etc/nginx/conf.d/onlyoffice.conf
docker exec onlyoffice-router nginx -t
docker exec onlyoffice-router nginx -s reload
```

### 步骤3：重启 .NET 容器清除配置缓存

```bash
docker restart onlyoffice-dotnet-services
```

### 步骤4：重新配置DocumentService URL

```bash
curl -X PUT "http://localhost:8092/api/2.0/files/docservice" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "DocServiceUrl": "http://43.135.17.107:8092/ds-api/",
    "DocServiceUrlInternal": "http://onlyoffice-document-server:80/",
    "DocServiceUrlPortal": "http://onlyoffice-router:8092/",
    "DocServiceSignatureSecret": "DocSpace2024SecureJwtSecretKey123!",
    "DocServiceSignatureHeader": "AuthorizationJwt",
    "DocServiceSslVerification": false
  }'
```

---

## 验证结果

### 端到端测试

| 测试项 | 测试前 | 测试后 |
|--------|--------|--------|
| ERR_NAME_NOT_RESOLVED 错误 | ❌ 存在 | ✅ 消失 |
| DocsAPI 加载失败 | ❌ 失败 | ✅ 成功 |
| WebSocket 连接 | ❌ 400错误 | ✅ 成功 |
| 文档编辑器加载 | ❌ 失败 | ✅ 成功 |

### 最终配置

```json
{
    "docServiceUrlApi": "http://43.135.17.107:8092/ds-api/web-apps/apps/api/documents/api.js",
    "docServiceUrl": "http://43.135.17.107:8092/ds-api/",
    "docServicePreloadUrl": "http://43.135.17.107:8092/ds-api/web-apps/apps/api/documents/preload.html",
    "docServiceUrlInternal": "http://onlyoffice-document-server:80/",
    "docServicePortalUrl": "http://onlyoffice-router:8092/",
    "docServiceSignatureHeader": "AuthorizationJwt",
    "docServiceSslVerification": false,
    "isDefault": false
}
```

### 截图证据

- 问题截图：`.playwright-cli/page-2026-04-14T07-39-08-533Z.png`
- 修复后截图：`.playwright-cli/page-2026-04-14T08-07-57-921Z.png`

---

## 备注

### 关键教训

1. **配置URL分类**：
   - `docServiceUrl` (Public) = 浏览器可访问的地址
   - `docServiceUrlInternal` (Internal) = 服务器间通信地址
   - `docServicePortalUrl` (Portal) = DocumentServer回调地址

2. **Nginx代理路由**：
   - 对于需要浏览器直接访问的DocumentServer API，需要通过nginx代理
   - 需要添加 WebSocket 支持（Upgrade headers）

3. **配置缓存**：
   - .NET 容器可能会缓存配置，重启服务后才能生效

### 文件修改记录

| 文件 | 修改内容 |
|------|----------|
| `/home/ubuntu/EasyDocs/DocSpace/buildtools/config/nginx/onlyoffice.conf` | 添加 `/ds-api/` 路由配置 |
