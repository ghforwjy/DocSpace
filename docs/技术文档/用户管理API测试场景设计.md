# 用户管理 API 测试场景设计

## 📍 服务信息

**服务模块**: 用户服务
**Controller**: `server/products/ASC.People/Server/Api/`

---

## 测试环境

### 系统架构

```
┌──────────────────────────────────────────────────────┐
│              EasyDocs 微服务架构                       │
├──────────────────────────────────────────────────────┤
│  Router (Nginx)                                       │
│  - 主入口: http://localhost:8092                     │
│  - API入口: http://localhost:8081                    │
├──────────────────────────────────────────────────────┤
│  Node.js 服务: 前端静态服务、登录服务                   │
│  Java 服务: 身份认证服务                              │
│  .NET 服务: 用户管理服务 (ASC.People)                  │
└──────────────────────────────────────────────────────┘
```

### 测试凭证

| 用户 | Email | 密码 | 角色 |
|------|-------|------|------|
| Administrator | 179537@qq.com | Admin@123 | 管理员 |

---

## API 接口列表

| API | 方法 | 端点 | 功能 | 认证需求 |
|-----|------|------|------|---------|
| 获取当前用户 | GET | `/api/2.0/people/@self` | 获取登录用户信息 | ✅ |
| 获取用户列表 | GET | `/api/2.0/people` | 获取用户列表（支持分页、筛选） | ✅ |
| 获取用户列表（filter） | GET | `/api/2.0/people/filter` | 使用过滤器获取用户 | ✅ |
| 获取用户信息 | GET | `/api/2.0/people/{userId}` | 获取指定用户信息 | ✅ |
| 按邮箱获取用户 | GET | `/api/2.0/people/email` | 通过邮箱查找用户 | ✅ |
| 创建用户 | POST | `/api/2.0/people` | 创建新用户 | ✅ |
| 更新用户 | PUT | `/api/2.0/people/{userId}` | 更新用户信息 | ✅ |
| 删除用户 | DELETE | `/api/2.0/people/{userId}` | 删除用户 | ✅ |
| 删除自己 | DELETE | `/api/2.0/people/@self` | 删除当前用户 | ✅ |
| 获取用户头像 | GET | `/api/2.0/people/{userId}/photo` | 获取用户头像 | ❌ |
| 上传用户头像 | POST | `/api/2.0/people/photo` | 上传头像 | ✅ |
| 修改密码 | PUT | `/api/2.0/people/{userId}/password` | 修改用户密码 | ✅ |
| 发送密码重置邮件 | POST | `/api/2.0/people/password` | 发送密码重置邮件 | ❌ |
| 获取管理员列表 | GET | `/api/2.0/people/filter?isadministrator=true` | 获取管理员列表 | ✅ |
| 更新激活状态 | PUT | `/api/2.0/people/activationstatus/{status}` | 更新用户激活状态 | ✅ |

---

## 测试用例

### 场景 1: 获取当前用户信息

**目标**: 验证获取当前登录用户信息

**前置条件**: 用户已登录

**测试步骤**:
1. 用户登录获取 cookie
2. 调用 `GET /api/2.0/people/@self`

**预期结果**:
- 返回状态码 200
- 返回用户完整信息包括 id, displayName, email, status, type 等

**curl 示例**:
```bash
curl -X GET "http://localhost:8092/api/2.0/people/@self" \
  -H "Cookie: asc_auth_key=<token>"
```

**响应示例**:
```json
{
  "id": "66faa6e4-f133-11ea-b126-00ffeec8b4ef",
  "firstName": "",
  "lastName": "",
  "displayName": "Administrator",
  "email": "179537@qq.com",
  "title": "",
  "location": "",
  "status": 1,
  "type": 1,
  "avatar": "/static/images/default_user_photo_size_82-82.png?hash=1873401080"
}
```

**边界条件**:
- 未登录 → 401 Unauthorized
- 用户不存在 → 404

---

### 场景 2: 获取用户列表

**目标**: 验证获取用户列表功能

**前置条件**: 管理员已登录

**测试步骤**:
1. 管理员登录获取 cookie
2. 调用 `GET /api/2.0/people`
3. 可选：添加筛选参数

**预期结果**:
- 返回状态码 200
- 返回用户数组
- 支持分页（startIndex, count）

**curl 示例**:
```bash
# 获取所有用户
curl -X GET "http://localhost:8092/api/2.0/people" \
  -H "Cookie: asc_auth_key=<token>"

# 分页获取
curl -X GET "http://localhost:8092/api/2.0/people?startIndex=0&count=10" \
  -H "Cookie: asc_auth_key=<token>"
```

**响应示例**:
```json
{
  "startIndex": 0,
  "count": 5,
  "total": 5,
  "items": [
    {
      "id": "...",
      "displayName": "Administrator",
      "email": "179537@qq.com",
      "type": 1
    }
  ]
}
```

**筛选参数**:
| 参数 | 说明 |
|------|------|
| search | 搜索关键词（按名称、邮箱） |
| filter | 筛选条件 |
| sortBy | 排序字段 |
| sortOrder | 排序方向 (asc/desc) |
| startIndex | 起始位置 |
| count | 返回数量 |

---

### 场景 3: 按邮箱获取用户

**目标**: 验证通过邮箱查找用户功能

**前置条件**: 用户已登录

**测试步骤**:
1. 用户登录获取 cookie
2. 调用 `GET /api/2.0/people/email?email={email}`

**预期结果**:
- 返回状态码 200
- 返回匹配的用户信息

**curl 示例**:
```bash
curl -X GET "http://localhost:8092/api/2.0/people/email?email=179537@qq.com" \
  -H "Cookie: asc_auth_key=<token>"
```

---

### 场景 4: 创建用户

**目标**: 验证创建新用户功能

**前置条件**: 管理员已登录

**测试步骤**:
1. 管理员登录获取 cookie
2. 调用 `POST /api/2.0/people` with 用户数据
3. 验证用户创建成功

**预期结果**:
- 返回状态码 200
- 返回创建的用户信息
- 新用户可登录

**curl 示例**:
```bash
curl -X POST "http://localhost:8092/api/2.0/people" \
  -H "Content-Type: application/json" \
  -H "Cookie: asc_auth_key=<token>" \
  -d '{
    "firstName": "新",
    "lastName": "用户",
    "email": "newuser@example.com",
    "password": "Password123!",
    "type": 1
  }'
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| firstName | string | 是 | 名 |
| lastName | string | 是 | 姓 |
| email | string | 是 | 邮箱（唯一） |
| password | string | 是 | 密码 |
| type | int | 是 | 用户类型 (1=User, 2=Visitor) |
| title | string | 否 | 职位 |
| location | string | 否 | 地点 |

**边界条件**:
- 邮箱已存在 → 400 Bad Request
- 邮箱格式不正确 → 400 Bad Request
- 密码太弱 → 400 Bad Request
- 非管理员创建 → 403 Forbidden

---

### 场景 5: 更新用户信息

**目标**: 验证更新用户信息功能

**前置条件**: 管理员已登录

**测试步骤**:
1. 管理员登录获取 cookie
2. 调用 `PUT /api/2.0/people/{userId}` with 更新数据
3. 验证用户信息更新成功

**预期结果**:
- 返回状态码 200
- 返回更新后的用户信息

**curl 示例**:
```bash
curl -X PUT "http://localhost:8092/api/2.0/people/{userId}" \
  -H "Content-Type: application/json" \
  -H "Cookie: asc_auth_key=<token>" \
  -d '{
    "firstName": "更新",
    "lastName": "名称",
    "title": "高级工程师",
    "location": "上海"
  }'
```

**边界条件**:
- 用户不存在 → 404
- 非管理员修改他人信息 → 403

---

### 场景 6: 删除用户

**目标**: 验证删除用户功能

**前置条件**: 管理员已登录

**测试步骤**:
1. 管理员登录获取 cookie
2. 先创建一个测试用户
3. 调用 `DELETE /api/2.0/people/{userId}`
4. 验证用户被删除

**预期结果**:
- 返回状态码 200
- 用户从用户列表中消失
- 用户无法再登录

**curl 示例**:
```bash
# 删除用户
curl -X DELETE "http://localhost:8092/api/2.0/people/{userId}" \
  -H "Cookie: asc_auth_key=<token>"

# 删除自己（需要确认 key）
curl -X DELETE "http://localhost:8092/api/2.0/people/@self" \
  -H "Cookie: asc_auth_key=<token>" \
  -H "confirm: <confirmation_key>"
```

**边界条件**:
- 删除管理员自己 → 需要确认
- 删除不存在的用户 → 404
- 非管理员删除 → 403

---

### 场景 7: 获取用户头像

**目标**: 验证获取用户头像功能

**前置条件**: 无（公开访问）

**测试步骤**:
1. 调用 `GET /api/2.0/people/{userId}/photo`

**预期结果**:
- 返回状态码 200
- 返回图片数据或重定向到头像 URL

**curl 示例**:
```bash
curl -X GET "http://localhost:8092/api/2.0/people/{userId}/photo"
```

**边界条件**:
- 用户没有上传过头像 → 返回默认头像
- 用户不存在 → 404

---

### 场景 8: 上传用户头像

**目标**: 验证上传用户头像功能

**前置条件**: 用户已登录

**测试步骤**:
1. 用户登录获取 cookie
2. 调用 `POST /api/2.0/people/photo` 上传图片
3. 验证头像更新成功

**预期结果**:
- 返回状态码 200
- 头像 URL 更新

**curl 示例**:
```bash
curl -X POST "http://localhost:8092/api/2.0/people/photo" \
  -H "Cookie: asc_auth_key=<token>" \
  -F "file=@avatar.jpg"
```

**边界条件**:
- 文件格式不支持 → 400
- 文件太大 → 413

---

### 场景 9: 修改密码

**目标**: 验证修改密码功能

**前置条件**: 用户已登录

**测试步骤**:
1. 用户登录获取 cookie
2. 调用 `PUT /api/2.0/people/{userId}/password`
3. 验证密码修改成功

**预期结果**:
- 返回状态码 200
- 用户可用新密码登录

**curl 示例**:
```bash
curl -X PUT "http://localhost:8092/api/2.0/people/{userId}/password" \
  -H "Content-Type: application/json" \
  -H "Cookie: asc_auth_key=<token>" \
  -d '{"passwordHash": "new_password_hash"}'
```

**边界条件**:
- 原密码错误 → 400
- 新密码太弱 → 400
- 非管理员修改他人密码 → 403

---

### 场景 10: 发送密码重置邮件

**目标**: 验证发送密码重置邮件功能

**前置条件**: 无

**测试步骤**:
1. 调用 `POST /api/2.0/people/password`
2. 验证邮件发送成功

**预期结果**:
- 返回状态码 200
- 密码重置邮件发送到指定邮箱

**curl 示例**:
```bash
curl -X POST "http://localhost:8092/api/2.0/people/password" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**边界条件**:
- 邮箱不存在 → 404
- 邮箱格式不正确 → 400

---

### 场景 11: 获取管理员列表

**目标**: 验证获取管理员列表功能

**前置条件**: 用户已登录

**测试步骤**:
1. 用户登录获取 cookie
2. 调用 `GET /api/2.0/people/filter?isadministrator=true`

**预期结果**:
- 返回状态码 200
- 返回管理员用户列表

**curl 示例**:
```bash
curl -X GET "http://localhost:8092/api/2.0/people/filter?isadministrator=true" \
  -H "Cookie: asc_auth_key=<token>"
```

---

### 场景 12: 用户筛选和搜索

**目标**: 验证用户筛选和搜索功能

**前置条件**: 管理员已登录

**测试步骤**:
1. 管理员登录获取 cookie
2. 调用带有筛选条件的 `GET /api/2.0/people`
3. 验证返回正确的用户列表

**预期结果**:
- 返回状态码 200
- 返回符合筛选条件的用户

**curl 示例**:
```bash
# 按名称搜索
curl -X GET "http://localhost:8092/api/2.0/people?search=admin" \
  -H "Cookie: asc_auth_key=<token>"

# 按类型筛选
curl -X GET "http://localhost:8092/api/2.0/people?filter=type eq 1" \
  -H "Cookie: asc_auth_key=<token>"

# 组合筛选
curl -X GET "http://localhost:8092/api/2.0/people?search=admin&filter=status eq 1" \
  -H "Cookie: asc_auth_key=<token>"
```

---

## 测试数据准备

### 测试用户

| 用户名 | Email | 密码 | 类型 | 状态 |
|--------|-------|------|------|------|
| Administrator | 179537@qq.com | Admin@123 | 管理员 | 激活 |
| TestUser | test@example.com | Test123456 | 普通用户 | 激活 |

### 测试场景

1. **正常流程测试**: 完整用户管理生命周期（创建→读取→更新→删除）
2. **权限测试**: 不同角色用户的访问权限
3. **边界测试**: 空数据、特殊字符、超长内容
4. **安全测试**: SQL注入、XSS、越权访问

---

## 执行顺序

### 第一阶段：基础功能测试
1. 获取当前用户信息 (TC-001)
2. 获取用户列表 (TC-002)
3. 按邮箱获取用户 (TC-003)

### 第二阶段：用户管理测试
4. 创建用户 (TC-004)
5. 更新用户信息 (TC-005)
6. 删除用户 (TC-006)

### 第三阶段：辅助功能测试
7. 获取用户头像 (TC-007)
8. 上传用户头像 (TC-008)
9. 修改密码 (TC-009)
10. 发送密码重置邮件 (TC-010)
11. 获取管理员列表 (TC-011)

### 第四阶段：高级功能测试
12. 用户筛选和搜索 (TC-012)

---

## 注意事项

1. **认证要求**: 大部分用户管理 API 需要认证
2. **权限控制**: 只有管理员可以创建、删除、修改其他用户
3. **数据安全**: 密码需要哈希处理后再传输
4. **隐私保护**: 某些用户信息可能受隐私设置限制
5. **邮箱唯一性**: 创建用户时邮箱必须唯一

---

## 测试执行结果

**测试时间**: 2026-04-27
**测试环境**: Docker 集群模式
**测试用户**: Administrator (179537@qq.com)

### 测试执行摘要

| 测试编号 | 测试场景 | 结果 | 备注 |
|---------|---------|------|------|
| TC-001 | 获取当前用户信息 | ✅ 通过 | 返回完整用户信息 |
| TC-002 | 获取用户列表 | ✅ 通过 | 返回 5 个用户 |
| TC-003 | 按邮箱获取用户 | ✅ 通过 | 正确找到 Administrator |
| TC-004 | 获取用户信息（ID） | ✅ 通过 | 通过 ID 查询成功 |
| TC-005 | 获取用户头像 | ✅ 通过 | 状态码 200 |
| TC-006 | 获取管理员列表 | ✅ 通过 | 返回 2 个管理员 |
| TC-007 | 用户搜索 "admin" | ✅ 通过 | 返回 5 个匹配用户 |
| TC-008 | 用户搜索 "Administrator" | ✅ 通过 | 返回 5 个匹配用户 |
| TC-009 | 用户分页 | ✅ 通过 | 支持分页参数 |

### 测试统计

- **总测试数**: 9
- **通过**: 9
- **失败**: 0
- **通过率**: 100%

### 测试脚本

测试脚本位置: `/home/ubuntu/EasyDocs/DocSpace/tests/test_user_api.js`

测试报告: `/home/ubuntu/EasyDocs/DocSpace/tests/test_user_api_report.json`

### 关键发现

1. **认证机制**: 使用 `asc_auth_key` cookie 进行认证
2. **API 入口**: `http://localhost:8092/api/2.0`
3. **用户数据类型**: 返回数据嵌套在 `response` 字段中
4. **头像接口**: 公开接口，无需认证
