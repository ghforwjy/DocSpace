# 05 - 文件夹操作 API

## 📍 服务信息

**服务模块**: 文件服务
**Controller**: `server/products/ASC.Files/Server/Api/FoldersController.cs`

---

## 📂 核心文件夹操作 API

### 1️⃣ 创建文件夹

**接口**: `POST /api/2.0/files/folder/{folderId}`

**功能**: 在指定文件夹创建新文件夹

**请求参数**:
```json
{
  "folder": {
    "title": "新文件夹"
  }
}
```

**响应示例**:
```json
{
  "id": 456,
  "parentId": 123,
  "title": "新文件夹",
  "filesCount": 0,
  "foldersCount": 0,
  "updated": "2026-04-23T12:00:00.000Z",
  "created": "2026-04-23T12:00:00.000Z"
}
```

**调用示例**:
```javascript
async function createFolder(parentId, title) {
  const response = await fetch(
    `{baseUrl}/api/2.0/files/folder/${parentId}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        folder: {
          title: title
        }
      })
    }
  );
  return await response.json();
}
```

---

### 2️⃣ 删除文件夹

**接口**: `DELETE /api/2.0/files/folder/{folderId}`

**功能**: 删除指定文件夹

**请求参数**:
```json
{
  "delete": {
    "deleteAfter": false,
    "immediately": false
  }
}
```

---

### 3️⃣ 获取文件夹内容

**接口**: `GET /api/2.0/files/{folderId}`

**功能**: 获取文件夹内容（文件和子文件夹列表）

**参数**:
- `filter`: 筛选条件
- `sortBy`: 排序字段
- `sortOrder`: 排序方向
- `search`: 搜索关键词

**调用示例**:
```javascript
async function getFolderContent(folderId) {
  const response = await fetch(
    `{baseUrl}/api/2.0/files/${folderId}`,
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
{
  "folder": { ... },
  "files": [
    { "id": 1, "title": "文档1.docx", "type": "File" },
    { "id": 2, "title": "文档2.xlsx", "type": "File" }
  ],
  "folders": [
    { "id": 3, "title": "子文件夹", "type": "Folder" }
  ]
}
```

---

### 4️⃣ 获取文件夹历史

**接口**: `GET /api/2.0/files/folder/{folderId}/log`

**功能**: 获取文件夹活动历史记录

**参数**:
- `fromDate`: 开始日期
- `toDate`: 结束日期
- `startIndex`: 起始位置
- `count`: 获取数量

---

## 📋 文件夹管理完整示例

### 完整文件夹操作流程
```javascript
// 1. 获取根文件夹内容
const rootContent = await getFolderContent(0);
console.log('根目录:', rootContent);

// 2. 创建新文件夹
const newFolder = await createFolder(0, '我的项目文件夹');
console.log('创建文件夹:', newFolder);

// 3. 在新文件夹中创建文件
const newFile = await createFile(newFolder.id, '项目文档.docx');
console.log('创建文件:', newFile);

// 4. 获取文件夹内容，验证文件已创建
const folderContent = await getFolderContent(newFolder.id);
console.log('文件夹内容:', folderContent);

// 5. 获取文件夹历史
const folderHistory = await getFolderHistory(newFolder.id);
console.log('文件夹历史:', folderHistory);
```

---

## 📝 注意事项

1. **递归删除**: 删除文件夹会同时删除其下所有文件和子文件夹
2. **回收站**: 默认删除会移动到回收站
3. **权限检查**: 操作需要相应的权限
4. **面包屑**: 可以通过面包屑获取文件夹完整路径
