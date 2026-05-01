# 02 - 用户管理 API

## 📍 服务信息

**服务模块**: 用户服务
**Controller**: `server/products/ASC.People/Server/Api/`

---

## 👥 用户管理模块结构

| 子模块 | Controller | 功能说明 |
|---------|-----------|---------|
| 用户资料 | `UserController.cs` | 用户信息获取、修改、创建 |
| 用户群组 | `GroupsController.cs` | 用户组管理 |
| 用户头像 | `PhotoController.cs` | 用户头像上传、获取 |
| API 密钥 | `ApiKeysController.cs` | API 密钥管理 |
| 第三方账号 | `AccountsController.cs` | 第三方登录账号管理 |

---

## 1️⃣ 用户资料

### 获取当前用户信息
**接口**: `GET /api/2.0/people/@self`

**调用示例**:
```javascript
async function getCurrentUser() {
  const response = await fetch('{baseUrl}/api/2.0/people/@self', {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  return await response.json();
}
```

**响应示例**:
```json
{
  "id": "user-guid-here",
  "firstName": "张",
  "lastName": "三",
  "displayName": "张三",
  "email": "zhangsan@example.com",
  "title": "开发工程师",
  "location": "北京",
  "status": "Active",
  "type": "User",
  "avatar": "https://..."
}
```

### 获取用户列表
**接口**: `GET /api/2.0/people`

**参数**:
- `filter`: 筛选条件
- `search`: 搜索关键词
- `sortBy`: 排序字段
- `sortOrder`: 排序方向

### 创建用户
**接口**: `POST /api/2.0/people`

**请求参数**:
```json
{
  "firstName": "张",
  "lastName": "三",
  "email": "zhangsan@example.com",
  "password": "password123",
  "title": "开发工程师",
  "location": "北京",
  "type": "User"
}
```

**调用示例**:
```javascript
async function createUser(userData) {
  const response = await fetch('{baseUrl}/api/2.0/people', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return await response.json();
}
```

### 更新用户信息
**接口**: `PUT /api/2.0/people/{userid}`

### 删除用户
**接口**: `DELETE /api/2.0/people/{userid}`

---

## 2️⃣ 用户头像

### 上传用户头像
**接口**: `POST /api/2.0/people/photo`

**请求**: multipart/form-data 上传

### 获取用户头像
**接口**: `GET /api/2.0/people/{userid}/photo`

---

## 3️⃣ 用户群组

### 获取群组列表
**接口**: `GET /api/2.0/people/group`

### 创建群组
**接口**: `POST /api/2.0/people/group`

### 管理群组成员
**接口**: `POST /api/2.0/people/group/{groupid}/members`

---

## 📋 完整用户管理场景示例

### 完整用户资料管理流程
```javascript
// 1. 获取当前用户信息
const currentUser = await getCurrentUser();
console.log('当前用户:', currentUser);

// 2. 获取用户列表
const userList = await fetchUserList({ search: '张' });

// 3. 如果需要，创建新用户
if (needCreateUser) {
  const newUser = await createUser({
    firstName: '新',
    lastName: '用户',
    email: 'newuser@example.com',
    password: 'password123'
  });
  console.log('创建用户:', newUser);
}
```

---

## 📝 注意事项

1. **权限要求**: 用户管理操作通常需要管理员权限
2. **密码安全**: 创建用户时使用强密码策略
3. **用户类型**: 区分管理员、普通用户、访客等类型
