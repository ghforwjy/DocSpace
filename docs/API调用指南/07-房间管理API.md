# 07 - 房间管理 API

## 📍 服务信息

**服务模块**: 文件服务
**Controller**: `server/products/ASC.Files/Server/Api/VirtualRoomsController.cs`

---

## 🏠 核心房间 API

### 1️⃣ 获取房间列表

**接口**: `GET /api/2.0/files/rooms`

**功能**: 获取用户可访问的房间列表

**调用示例**:
```javascript
async function getRoomList() {
  const response = await fetch(
    '{baseUrl}/api/2.0/files/rooms',
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    }
  );
  return await response.json();
}
```

**响应示例**:
```json
[
  {
    "id": 1,
    "title": "团队协作空间",
    "type": "Collaboration",
    "createdBy": "张三",
    "created": "2026-04-23T12:00:00.000Z",
    "updated": "2026-04-23T12:00:00.000Z"
  }
]
```

---

### 2️⃣ 创建房间

**接口**: `POST /api/2.0/files/rooms`

**功能**: 创建新房间

**请求参数**:
```json
{
  "room": {
    "title": "新房间",
    "type": "Collaboration",
    "description": "这是一个协作房间"
  }
}
```

**房间类型**:
- `Collaboration`: 协作房间
- `Custom`: 自定义房间
- `FillingForm`: 填表房间

---

### 3️⃣ 获取房间信息

**接口**: `GET /api/2.0/files/rooms/{roomId}`

**功能**: 获取指定房间的详细信息

---

### 4️⃣ 删除房间

**接口**: `DELETE /api/2.0/files/rooms/{roomId}`

---

### 5️⃣ 房间成员管理

**接口**: `POST /api/2.0/files/rooms/{roomId}/members`

**功能**: 添加成员到房间

**请求参数**:
```json
{
  "members": [
    {
      "userId": "user-guid",
      "access": "ReadWrite"
    }
  ]
}
```

---

## 📋 房间管理完整示例

### 完整房间管理流程
```javascript
// 1. 获取房间列表
const rooms = await getRoomList();
console.log('房间列表:', rooms);

// 2. 创建新房间
const newRoom = await createRoom({
  title: '我的项目房间',
  type: 'Collaboration',
  description: '项目协作空间'
});
console.log('创建房间:', newRoom);

// 3. 向房间添加成员
await addRoomMember(newRoom.id, userId, 'ReadWrite');
console.log('添加成员成功');

// 4. 在房间中创建文件夹和文件
const folder = await createFolder(newRoom.rootFolderId, '项目文档');
const file = await createFile(folder.id, '项目计划.docx');
console.log('房间内容已创建');

// 5. 获取房间信息验证
const roomInfo = await getRoomInfo(newRoom.id);
console.log('房间信息:', roomInfo);
```

---

## 📝 注意事项

1. **房间类型**: 根据使用场景选择合适的房间类型
2. **权限管理**: 房间有自己的权限管理机制
3. **成员管理**: 可以灵活添加、删除成员并设置权限
4. **空间隔离**: 不同房间的内容相互隔离
