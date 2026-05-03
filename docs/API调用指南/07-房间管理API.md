# 07 - 房间管理 API

## 📍 服务信息

**服务模块**: 文件服务
**Controller**: `server/products/ASC.Files/Server/Api/VirtualRoomsController.cs`
**请求基路径**: `/api/2.0/files/rooms`

---

## 🔑 认证方式

所有 API 请求需携带 DocSpace 认证 Cookie（`asc_auth_key`）或 Bearer Token。

---

## 🏠 核心房间 API

### 1️⃣ 获取房间列表

**接口**: `GET /api/2.0/files/rooms`

**调用示例**:
```javascript
const response = await fetch(
  '{baseUrl}/api/2.0/files/rooms',
  {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json', 'Cookie': dsCookie }
  }
);
const data = await response.json();
// data.response 为房间数组
```

---

### 2️⃣ 创建房间

**接口**: `POST /api/2.0/files/rooms`

**源码 DTO**: `CreateRoomRequestDto.cs`

**请求参数**:
```json
{
  "title": "部门协作房间",
  "roomType": 2,
  "private": false
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 房间标题 |
| `roomType` | number | ✅ | 房间类型（见下表） |
| `private` | boolean | ❌ | 是否为加密房间，默认 false |

**RoomType 枚举值**:

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | FillingFormsRoom | 表单填写房间 |
| 2 | EditingRoom | 协作房间（**常用**） |
| 6 | CustomRoom | 自定义房间 |

> ⚠️ **重要**：`private: true` 的房间要求所有被添加的成员拥有加密密钥（`encryption key`）。
> 如果用户没有加密密钥，API 返回 `403: "The user XXX does not have an encryption key"`。
> **建议**：对于自动化场景，使用 `private: false` 创建公开房间。

**创建房间时带 share 参数**（源码 `FileShareParams.cs`）：

创建时可在请求体中包含 `share` 数组，但经实测，**创建后通过 PUT share 添加成员更可靠**。

```json
{
  "title": "部门协作房间",
  "roomType": 2,
  "private": false,
  "share": [{ "shareTo": "用户GUID", "access": 2 }]
}
```

> ⚠️ 创建房间的 share 格式与 PUT share 不同！创建时用 `{ shareTo, access }`，PUT 时用 `{ invitations: [{ id, access }] }`。

---

### 3️⃣ 获取房间信息

**接口**: `GET /api/2.0/files/rooms/{roomId}`

**响应关键字段**:
- `response.id`: 房间 ID
- `response.title`: 房间标题
- `response.private`: 是否加密房间
- `response.rootFolderId`: 根文件夹 ID（用于文件操作）
- `response.roomType`: 房间类型

---

### 4️⃣ 删除房间

**接口**: `DELETE /api/2.0/files/rooms/{roomId}`

---

### 5️⃣ 房间成员管理（PUT share）

**接口**: `PUT /api/2.0/files/rooms/{roomId}/share`

**源码 DTO**: `RoomInvitationRequestDto.cs` + `RoomInvitation.cs`

#### 添加成员

**请求参数**:
```json
{
  "invitations": [
    { "id": "用户GUID", "access": 2 },
    { "id": "另一个用户GUID", "access": 1 }
  ],
  "notify": false
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `invitations` | array | ✅ | 邀请列表（**不是 "share"！**） |
| `invitations[].id` | string(GUID) | ✅ | DocSpace 用户 GUID |
| `invitations[].access` | number | ✅ | 权限枚举值 |
| `notify` | boolean | ❌ | 是否通知用户，默认 false |

#### 移除成员

**请求参数**:
```json
{
  "invitations": [
    { "id": "用户GUID", "access": 0 }
  ],
  "notify": false
}
```

> ⚠️ **移除成员使用 PUT + access:0，不是 DELETE！** DocSpace 源码 `SetRoomSecurity` 方法中，`FileShare.None`（值为 0）表示移除权限。

#### FileShare 枚举值

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | None | 无权限（**用于移除成员**） |
| 1 | ReadWrite | 读写 |
| 2 | Read | 只读 |
| 3 | Restrict | 限制 |
| 4 | Varies | 可变 |
| 5 | Review | 审阅 |
| 6 | Comment | 评论 |
| 7 | FillForms | 填表 |
| 8 | CustomFilter | 自定义过滤 |
| 9 | RoomManager | 房间管理员 |

---

### 6️⃣ 获取房间成员列表

**接口**: `GET /api/2.0/files/rooms/{roomId}/share`

**响应示例**:
```json
{
  "response": [
    {
      "access": 1,
      "sharedTo": {
        "id": "66faa6e4-f133-11ea-b126-00ffeec8b4ef",
        "userName": "administrator",
        "displayName": "Administrator",
        "email": "admin@example.com"
      },
      "isOwner": true,
      "canEditAccess": false
    },
    {
      "access": 2,
      "sharedTo": {
        "id": "用户GUID",
        "userName": "zhang.ming",
        "displayName": "明张"
      },
      "isOwner": false,
      "canEditAccess": true
    }
  ]
}
```

---

## ⚠️ 常见错误格式（不要使用！）

以下请求体格式返回 `200 OK` 但**不会实际添加成员**：

```javascript
// ❌ 错误：使用 "share" 而非 "invitations"
{ share: [{ id: "GUID", isGroup: false, access: 2 }] }

// ❌ 错误：使用 POST 方法（返回 405）
POST /api/2.0/files/rooms/{id}/share

// ❌ 错误：使用 DELETE 方法移除成员
DELETE /api/2.0/files/rooms/{id}/share  body: { userIds: [...] }
```

---

## 📋 房间管理完整示例

```javascript
const DS_BASE = 'http://localhost:8092';

// 1. 获取管理员 Cookie
const authRes = await fetch(`${DS_BASE}/api/2.0/authentication`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userName: 'admin@example.com', password: 'password' })
});
const cookie = authRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

// 2. 创建房间（private: false 避免加密密钥问题）
const createRes = await fetch(`${DS_BASE}/api/2.0/files/rooms`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
  body: JSON.stringify({ title: '项目协作房间', roomType: 2, private: false })
});
const roomData = await createRes.json();
const roomId = roomData.response.id;

// 3. 添加成员（使用 invitations 格式）
await fetch(`${DS_BASE}/api/2.0/files/rooms/${roomId}/share`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
  body: JSON.stringify({
    invitations: [{ id: '用户GUID', access: 2 }],
    notify: false
  })
});

// 4. 验证成员已添加
const shareRes = await fetch(`${DS_BASE}/api/2.0/files/rooms/${roomId}/share`, {
  headers: { 'Cookie': cookie }
});
const shareData = await shareRes.json();
console.log(`成员数: ${shareData.response.length}`);

// 5. 移除成员（使用 access: 0）
await fetch(`${DS_BASE}/api/2.0/files/rooms/${roomId}/share`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
  body: JSON.stringify({
    invitations: [{ id: '用户GUID', access: 0 }],
    notify: false
  })
});
```

---

## 📝 注意事项

1. **加密房间**：`private: true` 的房间要求所有成员拥有加密密钥，自动化场景建议使用 `private: false`
2. **PUT share 格式**：必须使用 `{ invitations: [{ id, access }], notify }` 格式，不能用 `{ share: [...] }`
3. **移除成员**：必须使用 `PUT + access: 0`，不能用 `DELETE`
4. **创建 vs PUT 的 share 格式不同**：创建时用 `{ shareTo, access }`，PUT 时用 `{ id, access }`
5. **空间隔离**：不同房间的内容相互隔离
