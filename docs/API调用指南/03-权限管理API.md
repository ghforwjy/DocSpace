# 03 - 权限管理 API

## 📍 服务信息

**服务模块**: 文件服务
**Controller**: `server/products/ASC.Files/Server/Api/SecurityController.cs`

---

## 🔐 权限管理核心 API

### 1️⃣ 分享文件

**接口**: `POST /api/2.0/files/file/{fileId}/share`

**功能**: 分享文件给用户或群组

**请求参数**:
```json
{
  "share": {
    "access": "ReadWrite",
    "users": ["user-guid-1", "user-guid-2"],
    "groups": ["group-guid-1"]
  }
}
```

**权限类型**:
- `Read`: 只读
- `ReadWrite`: 读写
- `FullAccess`: 完全控制

**调用示例**:
```javascript
async function shareFile(fileId, userId, accessLevel) {
  const response = await fetch(
    `{baseUrl}/api/2.0/files/file/${fileId}/share`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        share: {
          access: accessLevel,
          users: [userId]
        }
      })
    }
  );
  return await response.json();
}
```

---

### 2️⃣ 查看文件共享信息

**接口**: `GET /api/2.0/files/file/{fileId}/share`

**功能**: 获取文件共享信息

**响应示例**:
```json
{
  "fileId": 123,
  "shared": [
    {
      "userId": "user-guid",
      "displayName": "张三",
      "access": "ReadWrite",
      "sharedBy": "admin",
      "sharedOn": "2026-04-23T12:00:00.000Z"
    }
  ]
}
```

---

### 3️⃣ 取消文件共享

**接口**: `DELETE /api/2.0/files/file/{fileId}/share`

**功能**: 取消文件共享

---

### 4️⃣ 分享文件夹

**接口**: `POST /api/2.0/files/folder/{folderId}/share`

**功能**: 分享文件夹

---

## 📋 权限管理完整示例

### 完整权限管理流程
```javascript
const fileId = 123;
const userId = 'user-guid-here';

// 1. 查看当前共享信息
const currentShare = await getShareInfo(fileId);
console.log('当前共享:', currentShare);

// 2. 分享文件给用户
const shareResult = await shareFile(fileId, userId, 'ReadWrite');
console.log('分享结果:', shareResult);

// 3. 验证共享是否成功
const updatedShare = await getShareInfo(fileId);
console.log('更新后的共享:', updatedShare);

// 4. 如果需要，取消共享
if (needUnshare) {
  await unshareFile(fileId);
  console.log('取消共享成功');
}
```

---

## 📝 注意事项

1. **权限继承**: 文件夹权限会继承到子文件和子文件夹
2. **最低权限**: 用户权限以最低的为准（继承权限 + 直接权限）
3. **分享范围**: 可以分享给单个用户、用户组或所有人
4. **权限管理**: 需要有相应的权限才能进行分享操作
