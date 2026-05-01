# 04 - 文件操作 API

## 📍 服务信息

**服务模块**: 文件服务
**Controller**: `server/products/ASC.Files/Server/Api/FilesController.cs`

---

## 📁 核心文件操作 API

### 1️⃣ 创建文件

**接口**: `POST /api/2.0/files/{folderId}/file`

**功能**: 在指定文件夹创建新文件

**请求参数**:
```json
{
  "file": {
    "title": "新文档.docx",
    "templateId": 0,
    "formId": 0,
    "enableExternalExt": false
  }
}
```

**响应示例**:
```json
{
  "id": 123,
  "title": "新文档.docx",
  "fileType": "Document",
  "version": 1,
  "size": 0,
  "updated": "2026-04-23T12:00:00.000Z",
  "created": "2026-04-23T12:00:00.000Z"
}
```

**调用示例**:
```javascript
async function createFile(folderId, title) {
  const response = await fetch(
    `{baseUrl}/api/2.0/files/${folderId}/file`, 
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        file: {
          title: title
        }
      })
    }
  );
  return await response.json();
}
```

---

### 2️⃣ 创建文本文档

**接口**: `POST /api/2.0/files/{folderId}/text`

**功能**: 创建文本文档（.txt）

**请求参数**:
```json
{
  "file": {
    "title": "文档.txt",
    "content": "这是文档内容...",
    "createNewIfExist": true
  }
}
```

---

### 3️⃣ 创建 HTML 文档

**接口**: `POST /api/2.0/files/{folderId}/html`

**功能**: 创建 HTML 文档（.html）

---

### 4️⃣ 获取文件下载链接

**接口**: `GET /api/2.0/files/file/{fileId}/presigneduri`

**功能**: 获取预签名的文件下载 URL

**响应示例**:
```json
"https://download-url.com/file/..."
```

**调用示例**:
```javascript
async function getDownloadUrl(fileId) {
  const response = await fetch(
    `{baseUrl}/api/2.0/files/file/${fileId}/presigneduri`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    }
  );
  const url = await response.json();
  return url;
}
```

---

### 5️⃣ 删除文件

**接口**: `DELETE /api/2.0/files/file/{fileId}`

**功能**: 删除指定文件

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

### 6️⃣ 复制文件

**接口**: `POST /api/2.0/files/file/{fileId}/copyas`

**功能**: 复制文件到目标文件夹

**请求参数**:
```json
{
  "file": {
    "destFolderId": 456,
    "destTitle": "文档副本.docx",
    "password": "",
    "toForm": false
  }
}
```

---

## 📋 文件操作完整示例

### 完整文件操作流程
```javascript
// 1. 创建新文件
const newFile = await createFile(1, '我的文档.docx');
console.log('创建文件:', newFile);

// 2. 获取文件下载链接
const downloadUrl = await getDownloadUrl(newFile.id);
console.log('下载链接:', downloadUrl);

// 3. 复制文件
const copiedFile = await copyFile(newFile.id, {
  destFolderId: 1,
  destTitle: '我的文档副本.docx'
});
console.log('复制文件:', copiedFile);

// 4. 删除文件（可选）
if (needDelete) {
  await deleteFile(newFile.id);
  console.log('删除文件成功');
}
```

---

## 📝 注意事项

1. **文件类型**: 根据扩展名自动识别文件类型（DOCX/XLSX/PPTX 等）
2. **权限检查**: 删除、修改操作需要相应的权限
3. **版本管理**: 每次修改文件会自动创建新版本
4. **回收站**: 默认删除会移动到回收站，使用 `immediately` 进行永久删除
