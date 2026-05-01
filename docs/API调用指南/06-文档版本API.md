# 06 - 文档版本 API

## 📍 服务信息

**服务模块**: 文件服务
**Controller**: `server/products/ASC.Files/Server/Api/FilesController.cs`

---

## ⚠️ 重要：认证与初始化说明

### 系统初始化流程

如果系统尚未初始化（没有用户），需要按以下步骤进行：

#### 步骤1：发送注册邀请
**接口**: `POST /api/2.0/settings/sendjoininvite`

**功能**: 向指定邮箱发送注册邀请

**请求参数**:
```json
{
  "email": "admin@example.com"
}
```

**curl 示例**:
```bash
curl -X POST "http://localhost:8092/api/2.0/settings/sendjoininvite" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}'
```

#### 步骤2：完成 Portal 初始化
**接口**: `PUT /api/2.0/settings/wizard/complete`

**功能**: 完成 Portal 初始化，设置管理员账户

**请求参数**:
```json
{
  "email": "admin@example.com",
  "PasswordHash": "密码的哈希值",
  "lng": "zh-CN",
  "timeZone": "Asia/Shanghai",
  "analytics": false
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| email | string | 是 | 管理员邮箱 |
| PasswordHash | string | 是 | 密码哈希（需要先对密码进行哈希） |
| lng | string | 是 | 语言代码，如 "zh-CN"、"en-US" |
| timeZone | string | 是 | 时区，如 "Asia/Shanghai" |
| analytics | bool | 是 | 是否启用分析 |

**curl 示例**:
```bash
curl -X PUT "http://localhost:8092/api/2.0/settings/wizard/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "PasswordHash": "hashed_password",
    "lng": "zh-CN",
    "timeZone": "Asia/Shanghai",
    "analytics": false
  }'
```

---

### 登录认证流程（关键）

完成初始化后，使用以下流程登录：

#### 1. 登录认证
**接口**: `POST /api/2.0/authentication/`

**请求参数**:
```json
{
  "userName": "admin@example.com",
  "password": "your_password",
  "session": true
}
```

**curl 示例**:
```bash
# 1. 登录（获取 Cookie）
curl -v -X POST "http://localhost:8092/api/2.0/authentication/" \
  -H "Content-Type: application/json" \
  -d '{"userName":"admin@example.com","password":"your_password","session":true}'
```

#### 2. 提取 Cookie
从响应头的 `Set-Cookie` 中获取完整值，cookie 名为 `asc_auth_key`（注意不是 `asc_auth_token`）

#### 3. 使用 Cookie 访问受保护 API
```bash
# 使用 Cookie 访问文件 API
curl -X GET "http://localhost:8092/api/2.0/files/room" \
  -H "Cookie: asc_auth_key=url_encoded_token_value"
```

#### ⚠️ 重要：Cookie 名称说明

| 正确 | 错误 |
|------|------|
| `asc_auth_key` | `asc_auth_token` |

**原因**: 项目前端代码（`client/packages/shared/utils/axiosClient.ts`）中使用的是 `asc_auth_key`

**示例**:
```bash
# 正确的 Cookie header
-H "Cookie: asc_auth_key=ip%2BvTxR4pYSOBGA5wYu%2FO0gm3QYxOkwtwQNPN22vmFG2HfUobJQSPWV4Nwl3a82F5ep3mM5oSuShrWCivKQBjZCikuPixMZvUn9jrglI08n5Vw5G56%2F7DNvm0HmEjIBkT0pWsVXhw5ADsZxTQk5TtnzaUCelvQXEZbpGQeXdZwI%3D"
```

---

## 📚 API 接口列表

| 接口路径 | 方法 | 功能 | 认证需求 |
|---------|------|------|---------|
| `/api/2.0/settings/sendjoininvite` | POST | 发送注册邀请 | ❌ |
| `/api/2.0/settings/wizard/complete` | PUT | 完成 Portal 初始化 | ❌ |
| `/api/2.0/authentication/` | POST | 用户登录 | ❌ |
| `/api/2.0/files/file/{fileId}/history` | GET | 获取文件所有版本列表 | ✅ |
| `/api/2.0/files/file/{fileId}/history` | PUT | 修改版本历史（合并/恢复） | ✅ |
| `/api/2.0/files/file/{fileId}/edit/history` | GET | 获取编辑历史 | ❌ |
| `/api/2.0/files/file/{fileId}/edit/diff` | GET | 获取版本差异 URL | ❌ |
| `/api/2.0/files/file/{fileId}/restoreversion` | POST | 恢复到指定版本 | ✅ |
| `/api/2.0/files/file/{fileId}/comment` | PUT | 更新版本注释 | ✅ |
| `/api/2.0/files/file/{fileId}` | GET | 获取文件信息（可指定版本） | ❌ |
| `/api/2.0/files/file/{fileId}/log` | GET | 获取文件操作历史 | ✅ |

---

## 📜 核心版本 API

### 1️⃣ 获取文件版本列表

**接口**: `GET /api/2.0/files/file/{fileId}/history`

**功能**: 获取文件的所有历史版本列表

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| fileId | int | 是 | 文件 ID |

**认证**: ✅ 需要（携带 asc_auth_key cookie）

**curl 示例**:
```bash
curl -X GET "http://localhost:8092/api/2.0/files/file/123/history" \
  -H "Cookie: asc_auth_key=your_cookie_value"
```

**响应示例**:
```json
[
    {
        "id": 123,
        "title": "document.docx",
        "version": 3,
        "versionGroup": 3,
        "fileExst": ".docx",
        "comment": "",
        "contentLength": 1024,
        "pureContentLength": 1000
    }
]
```

---

### 2️⃣ 修改版本历史（合并/恢复）

**接口**: `PUT /api/2.0/files/file/{fileId}/history`

**功能**: 合并版本历史或恢复到指定版本

**认证**: ✅ 需要

**请求参数**:
```json
{
    "file": {
        "version": 2,
        "continueVersion": true
    }
}
```

**curl 示例**:
```bash
# 合并版本
curl -X PUT "http://localhost:8092/api/2.0/files/file/123/history" \
  -H "Content-Type: application/json" \
  -H "Cookie: asc_auth_key=your_cookie_value" \
  -d '{"file":{"version":2,"continueVersion":true}}'
```

---

### 3️⃣ 获取编辑历史

**接口**: `GET /api/2.0/files/file/{fileId}/edit/history`

**认证**: ❌ 不需要

**curl 示例**:
```bash
curl -X GET "http://localhost:8092/api/2.0/files/file/123/edit/history"
```

---

### 4️⃣ 获取版本差异 URL

**接口**: `GET /api/2.0/files/file/{fileId}/edit/diff?version={version}`

**认证**: ❌ 不需要

**curl 示例**:
```bash
curl -X GET "http://localhost:8092/api/2.0/files/file/123/edit/diff?version=2"
```

---

### 5️⃣ 恢复到指定版本

**接口**: `POST /api/2.0/files/file/{fileId}/restoreversion?version={version}`

**认证**: ✅ 需要

**curl 示例**:
```bash
curl -X POST "http://localhost:8092/api/2.0/files/file/123/restoreversion?version=2" \
  -H "Cookie: asc_auth_key=your_cookie_value"
```

---

### 6️⃣ 更新版本注释

**接口**: `PUT /api/2.0/files/file/{fileId}/comment`

**认证**: ✅ 需要

**curl 示例**:
```bash
curl -X PUT "http://localhost:8092/api/2.0/files/file/123/comment" \
  -H "Content-Type: application/json" \
  -H "Cookie: asc_auth_key=your_cookie_value" \
  -d '{"file":{"version":2,"comment":"这是对版本 2 的注释"}}'
```

---

### 7️⃣ 获取指定版本文件信息

**接口**: `GET /api/2.0/files/file/{fileId}?version={version}`

**认证**: ❌ 不需要

**curl 示例**:
```bash
# 获取当前版本
curl -X GET "http://localhost:8092/api/2.0/files/file/123"

# 获取指定版本
curl -X GET "http://localhost:8092/api/2.0/files/file/123?version=2"
```

---

### 8️⃣ 获取文件操作历史

**接口**: `GET /api/2.0/files/file/{fileId}/log`

**认证**: ✅ 需要

**curl 示例**:
```bash
curl -X GET "http://localhost:8092/api/2.0/files/file/123/log" \
  -H "Cookie: asc_auth_key=your_cookie_value"
```

---

## 📋 版本管理完整示例

### 完整版本管理流程（JavaScript）
```javascript
class VersionManager {
    constructor(baseUrl, cookie) {
        this.baseUrl = baseUrl;
        this.cookie = cookie;
    }

    async request(endpoint, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cookie': this.cookie,
                ...options.headers
            }
        });
        return response.json();
    }

    async getVersionList(fileId) {
        return this.request(`/api/2.0/files/file/${fileId}/history`);
    }

    async getEditHistory(fileId) {
        return this.request(`/api/2.0/files/file/${fileId}/edit/history`);
    }

    async getDiffUrl(fileId, version) {
        return this.request(`/api/2.0/files/file/${fileId}/edit/diff?version=${version}`);
    }

    async mergeVersions(fileId, fromVersion) {
        return this.request(`/api/2.0/files/file/${fileId}/history`, {
            method: 'PUT',
            body: JSON.stringify({
                file: {
                    version: fromVersion,
                    continueVersion: true
                }
            })
        });
    }

    async restore(fileId, version) {
        return this.request(`/api/2.0/files/file/${fileId}/restoreversion?version=${version}`, {
            method: 'POST'
        });
    }

    async updateComment(fileId, version, comment) {
        return this.request(`/api/2.0/files/file/${fileId}/comment`, {
            method: 'PUT',
            body: JSON.stringify({
                file: {
                    version: version,
                    comment: comment
                }
            })
        });
    }
}

// 使用示例
async function main() {
    const loginResult = await login('admin@example.com', 'your_password');
    if (!loginResult.cookie) {
        console.error('登录失败');
        return;
    }

    const vm = new VersionManager('http://localhost:8092', loginResult.cookie);
    const versions = await vm.getVersionList(123);
    console.log('版本列表:', versions);
}

main();
```

---

## 📚 版本与版本组说明

### 核心概念

**版本号 (Version)**:
- 每次保存都递增
- 唯一标识一个历史版本
- 形如: 1, 2, 3, 4, 5

**版本组 (VersionGroup)**:
- 用于版本合并
- 多个版本可以属于同一组
- 通常等于版本号，合并后会变小

### 合并版本原理

假设版本:
```
v1: Version=1, VersionGroup=2
v2: Version=2, VersionGroup=3
v3: Version=3, VersionGroup=4
v4: Version=4, VersionGroup=5
```

调用合并 API: `continueVersion=true, version=2`
```
v2: Version=2, VersionGroup=3
v3: Version=3, VersionGroup=3 (减少了)
v4: Version=4, VersionGroup=4 (减少了)
```
结果: v2、v3 现在属于同一组，可以作为一个版本合并显示

---

## 📝 注意事项

1. **Cookie 名称**: 必须是 `asc_auth_key`，不是 `asc_auth_token`
2. **初始化要求**: 首次使用需要通过 `sendjoininvite` 和 `wizard/complete` 初始化系统
3. **认证要求**: 修改、恢复、更新注释等操作需要登录获取 session cookie
4. **公开访问**: 获取编辑历史、差异 URL 等为公开访问
5. **自动版本**: 每次编辑文档会自动创建新版本
6. **版本保留**: 系统会保留所有历史版本
7. **权限要求**: 修改操作需要编辑权限
8. **差异比较**: 使用 diff URL 可以通过文档服务器查看版本差异
9. **版本注释**: 可以为重要版本添加注释说明
10. **版本恢复**: 恢复操作会创建新的版本，不会删除现有历史
