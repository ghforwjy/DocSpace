# ISSUE-015: 文档版本管理 API 测试

## 问题基本信息

| 项目 | 内容 |
|------|------|
| 问题编号 | ISSUE-015 |
| 发现时间 | 2026-04-27 |
| 问题类型 | 接口测试 |
| 问题状态 | ✅ 已解决并验证 |
| 测试对象 | 文档版本管理 API |
| 测试方式 | Web 接口测试（HTTP） |

---

## ✅ 问题解决总结

### 关键发现

通过查看**项目前端源码**，找到了正确的 API 调用方式：

1. **Cookie 名称**: `asc_auth_key`（不是 `asc_auth_token`）

2. **API 前缀**: `/api/2.0/`

3. **认证流程**:
   - 登录获取 token
   - 从 `Set-Cookie` header 提取 `asc_auth_key`
   - 后续请求携带该 cookie

4. **正确的 API 路径**:
   - 房间列表: `/api/2.0/files/rooms`
   - 文件夹内容: `/api/2.0/files/folder/{id}`
   - 文件版本: `/api/2.0/files/file/{id}/history`
   - 创建文件: `/api/2.0/files/{folderId}/file`

---

## ✅ 测试验证结果

### 1. 登录认证

```bash
curl -X POST "http://localhost:8092/api/2.0/authentication/" \
  -H "Content-Type: application/json" \
  -d '{"userName":"179537@qq.com","password":"Admin@123","session":true}'
```

**结果**: ✅ 成功，返回 `asc_auth_key` cookie

### 2. 获取房间列表

```bash
curl "http://localhost:8092/api/2.0/files/rooms" \
  -H "Cookie: asc_auth_key=<token>"
```

**结果**: ✅ 成功，返回房间列表（含 "test" 房间 ID=25）

### 3. 创建文件

```bash
curl -X POST "http://localhost:8092/api/2.0/files/25/file" \
  -H "Cookie: asc_auth_key=<token>" \
  -H "Content-Type: application/json" \
  -d '{"Title":"Test Document.docx"}'
```

**结果**: ✅ 成功
- 文件 ID: 27
- 版本: 1
- 版本组: 1
- 标题: "Test Document.docx"

### 4. 获取文件版本历史

```bash
curl "http://localhost:8092/api/2.0/files/file/27/history" \
  -H "Cookie: asc_auth_key=<token>"
```

**结果**: ✅ 成功，返回完整的版本信息
```json
{
  "response": [{
    "id": 27,
    "version": 1,
    "versionGroup": 1,
    "title": "Test Document.docx",
    "comment": "已创建"
  }]
}
```

---

## 📋 完整的 API 测试用例

| 编号 | API | 方法 | 结果 | 备注 |
|------|-----|------|------|------|
| TC-015-01 | `/api/2.0/authentication/` | POST | ✅ 通过 | 返回 token |
| TC-015-02 | `/api/2.0/files/rooms` | GET | ✅ 通过 | 返回房间列表 |
| TC-015-03 | `/api/2.0/files/{id}/file` | POST | ✅ 通过 | 创建文件成功 |
| TC-015-04 | `/api/2.0/files/file/{id}/history` | GET | ✅ 通过 | 返回版本历史 |

---

## 📚 更新的文档

### 1. API 文档
**文件**: `/home/ubuntu/EasyDocs/DocSpace/docs/API调用指南/06-文档版本API.md`

**更新内容**:
- ✅ 正确的 Cookie 名称：`asc_auth_key`
- ✅ 完整的认证流程说明
- ✅ 正确的 API 路径前缀：`/api/2.0/`
- ✅ curl 和 JavaScript 示例

### 2. 测试脚本
**文件**: `/home/ubuntu/EasyDocs/DocSpace/tests/test_version_api.js`

### 3. 测试场景设计
**文件**: `/home/ubuntu/EasyDocs/DocSpace/docs/技术文档/版本管理API测试场景设计.md`

---

## 🔑 关键代码位置

| 功能 | 文件位置 |
|------|---------|
| Axios 客户端配置 | `client/packages/shared/utils/axiosClient.ts` |
| 登录 API | `client/packages/shared/api/auth/index.ts` |
| 创建文件 API | `client/packages/shared/api/files/index.ts` (createFile 函数) |
| 获取房间 API | `client/packages/shared/api/rooms/index.ts` (getRooms 函数) |

---

## 验证日志

### 2026-04-27

| 时间 | 操作 | 结果 |
|------|------|------|
| 10:55 | 测试登录 | ✅ 成功 |
| 10:58 | 获取房间列表 | ✅ 成功 |
| 10:10 | 创建文件 | ✅ 成功 (ID=27) |
| 10:10 | 获取版本历史 | ✅ 成功 |

---

## 下一步

API 认证和调用问题已完全解决！后续可以：

1. ✅ 完善测试数据
2. ✅ 执行完整的版本管理 API 测试
3. ✅ 编写自动化测试脚本

---

## 附录：正确的 curl 调用模板

```bash
# 1. 登录获取 Cookie
curl -v -X POST "http://localhost:8092/api/2.0/authentication/" \
  -H "Content-Type: application/json" \
  -d '{"userName":"179537@qq.com","password":"Admin@123","session":true}'

# 2. 提取 Set-Cookie header 中的 asc_auth_key 值

# 3. 使用 Cookie 访问受保护的 API
curl "http://localhost:8092/api/2.0/files/file/{fileId}/history" \
  -H "Cookie: asc_auth_key=<url_encoded_token>"
```
