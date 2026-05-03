# 03 - 权限管理 API

## 📍 服务信息

**服务模块**: 文件服务
**Controller**: `server/products/ASC.Files/Server/Api/SecurityController.cs`
**请求基路径**: `/api/2.0/files`

---

## 🔑 认证方式

所有 API 请求需携带 DocSpace 认证 Cookie（`asc_auth_key`）或 Bearer Token。

---

## 🔐 权限管理核心 API

### 1️⃣ 分享房间（PUT share）

**接口**: `PUT /api/2.0/files/rooms/{roomId}/share`

**源码 DTO**: `RoomInvitationRequestDto.cs` + `RoomInvitation.cs`

**功能**: 添加/移除房间成员

**添加成员请求参数**:
```json
{
  "invitations": [
    { "id": "用户GUID", "access": 2 }
  ],
  "notify": false
}
```

**移除成员请求参数**:
```json
{
  "invitations": [
    { "id": "用户GUID", "access": 0 }
  ],
  "notify": false
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `invitations` | array | ✅ | 邀请列表（**不是 "share"！**） |
| `invitations[].id` | string(GUID) | ✅ | DocSpace 用户 GUID |
| `invitations[].access` | number | ✅ | 权限枚举值（0=移除） |
| `notify` | boolean | ❌ | 是否通知用户，默认 false |
| `message` | string | ❌ | 通知消息内容 |
| `force` | boolean | ❌ | 是否强制添加 |

**FileShare 枚举值**:

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

**调用示例**:
```javascript
async function addRoomMember(roomId, userGuid, access, cookie) {
  const response = await fetch(
    `{baseUrl}/api/2.0/files/rooms/${roomId}/share`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({
        invitations: [{ id: userGuid, access }],
        notify: false
      })
    }
  );
  return await response.json();
}

async function removeRoomMember(roomId, userGuid, cookie) {
  const response = await fetch(
    `{baseUrl}/api/2.0/files/rooms/${roomId}/share`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({
        invitations: [{ id: userGuid, access: 0 }],
        notify: false
      })
    }
  );
  return await response.json();
}
```

---

### 2️⃣ 查看房间共享信息

**接口**: `GET /api/2.0/files/rooms/{roomId}/share`

**功能**: 获取房间成员列表

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
      "canEditAccess": false,
      "canRevoke": false
    },
    {
      "access": 2,
      "sharedTo": {
        "id": "用户GUID",
        "userName": "zhang.ming",
        "displayName": "明张"
      },
      "isOwner": false,
      "canEditAccess": true,
      "canRevoke": true
    }
  ],
  "count": 2
}
```

---

### 3️⃣ 分享文件/文件夹

**接口**: `PUT /api/2.0/files/file/{fileId}/share` 或 `PUT /api/2.0/files/folder/{folderId}/share`

**功能**: 设置文件或文件夹的共享权限

> ⚠️ 文件/文件夹的 share 格式可能与房间 share 不同，具体请参考 DocSpace 源码中 `AceWrapper` 相关 DTO。

---

## ⚠️ 常见错误格式（不要使用！）

以下请求体格式返回 `200 OK` 但**不会实际添加成员**：

```javascript
// ❌ 错误1：使用 "share" 键而非 "invitations"
{ share: [{ id: "GUID", isGroup: false, access: 2 }] }

// ❌ 错误2：使用 POST 方法（返回 405 Method Not Allowed）
POST /api/2.0/files/rooms/{id}/share

// ❌ 错误3：使用 DELETE 方法移除成员（不生效）
DELETE /api/2.0/files/rooms/{id}/share
body: { userIds: ["GUID"] }
```

**关键要点**：
1. DocSpace 的 PUT share API 静默接受错误格式（返回 200），但不会执行操作
2. 必须使用 `invitations` 键，不是 `share`
3. 每个 invitation 只需 `id` 和 `access` 两个字段，不需要 `isGroup`
4. 移除成员用 `access: 0`，不是 DELETE

---

## 📋 权限管理完整示例

### 房间成员管理流程
```javascript
const DS_BASE = 'http://localhost:8092';
const roomId = 84;
const userGuid = '用户GUID';

// 1. 查看当前共享信息
const currentShare = await fetch(`${DS_BASE}/api/2.0/files/rooms/${roomId}/share`, {
  headers: { 'Cookie': cookie }
});
const shareData = await currentShare.json();
console.log('当前成员数:', shareData.response.length);

// 2. 添加成员（只读权限）
await fetch(`${DS_BASE}/api/2.0/files/rooms/${roomId}/share`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
  body: JSON.stringify({
    invitations: [{ id: userGuid, access: 2 }],
    notify: false
  })
});

// 3. 验证共享是否成功
const updatedShare = await fetch(`${DS_BASE}/api/2.0/files/rooms/${roomId}/share`, {
  headers: { 'Cookie': cookie }
});
const updatedData = await updatedShare.json();
const member = updatedData.response.find(m => m.sharedTo.id === userGuid);
console.log('成员已添加:', !!member, '权限:', member?.access);

// 4. 移除成员（使用 access: 0）
await fetch(`${DS_BASE}/api/2.0/files/rooms/${roomId}/share`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
  body: JSON.stringify({
    invitations: [{ id: userGuid, access: 0 }],
    notify: false
  })
});
```

---

## 📝 注意事项

1. **权限继承**: 文件夹权限会继承到子文件和子文件夹
2. **最低权限**: 用户权限以最低的为准（继承权限 + 直接权限）
3. **静默失败**: DocSpace PUT share API 对错误格式静默返回 200，必须通过 GET share 验证操作是否生效
4. **invitations 格式**: 必须使用 `{ invitations: [{ id, access }], notify }` 格式
5. **移除成员**: 使用 `access: 0`（FileShare.None），不是 DELETE
6. **加密房间**: `private: true` 的房间添加成员时，成员必须拥有加密密钥，否则返回 403
