# 08 - 其他 API

## 📍 概述

本文档介绍其他对独立前端开发重要的 API。

---

## 🔍 搜索 API

### 搜索文件

**接口**: `GET /api/2.0/files/search`

**功能**: 搜索文件和文件夹

**参数**:
- `query`: 搜索关键词
- `start`: 起始位置
- `count`: 返回数量

**调用示例**:
```javascript
async function searchFiles(query) {
  const response = await fetch(
    `${baseUrl}/api/2.0/files/search?query=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    }
  );
  return await response.json();
}

// 使用示例
const results = await searchFiles('项目计划');
console.log('搜索结果:', results);
```

---

## 🏷️ 标签 API

### 获取文件标签

**接口**: `GET /api/2.0/files/file/{fileId}/tags`

**功能**: 获取文件关联的标签

**调用示例**:
```javascript
async function getFileTags(fileId) {
  const response = await fetch(
    `${baseUrl}/api/2.0/files/file/${fileId}/tags`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    }
  );
  return await response.json();
}
```

### 添加标签

**接口**: `PUT /api/2.0/files/file/{fileId}/tags`

**功能**: 给文件添加标签

**请求参数**:
```json
{
  "tags": ["标签1", "标签2"]
}
```

---

## 📊 统计 API

### 获取存储统计

**接口**: `GET /api/2.0/files/storage`

**功能**: 获取存储使用情况统计

**调用示例**:
```javascript
async function getStorageStats() {
  const response = await fetch(
    `${baseUrl}/api/2.0/files/storage`,
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
  "total": 10737418240,
  "used": 5368709120,
  "free": 5368709120
}
```

---

## ⭐ 收藏夹 API

### 收藏文件

**接口**: `PUT /api/2.0/files/file/{fileId}/isfavorite`

**功能**: 收藏或取消收藏文件

**请求参数**:
```json
{
  "file": {
    "isFavorite": true
  }
}
```

### 获取收藏列表

**接口**: `GET /api/2.0/files/favorites`

**功能**: 获取用户收藏的文件列表

---

## 🔄 回收站 API

### 获取回收站内容

**接口**: `GET /api/2.0/files/trashbin`

**功能**: 获取回收站中的文件和文件夹

### 删除到回收站

**接口**: `DELETE /api/2.0/files/file/{fileId}`

**功能**: 将文件移动到回收站

**注意**: 这不是永久删除，文件会进入回收站

### 从回收站恢复

**接口**: `PUT /api/2.0/files/trashbin/{itemId}/restore`

**功能**: 从回收站恢复项目

---

## 🔧 工具 API

### 验证文件名

**接口**: `POST /api/2.0/files/validate/filename`

**功能**: 验证文件名是否合法

**请求参数**:
```json
{
  "title": "文件名.docx",
  "extension": ".docx"
}
```

---

## 📋 综合工具示例

```javascript
/**
 * 综合工具函数集合
 */
class DocSpaceUtils {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * 搜索文件
   */
  async searchFiles(query) {
    const response = await fetch(
      `${this.baseUrl}/api/2.0/files/search?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }
    );
    return await response.json();
  }

  /**
   * 收藏文件
   */
  async toggleFavorite(fileId, isFavorite) {
    const response = await fetch(
      `${this.baseUrl}/api/2.0/files/file/${fileId}/isfavorite`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          file: {
            isFavorite: isFavorite
          }
        })
      }
    );
    return await response.json();
  }

  /**
   * 获取收藏列表
   */
  async getFavorites() {
    const response = await fetch(
      `${this.baseUrl}/api/2.0/files/favorites`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }
    );
    return await response.json();
  }

  /**
   * 获取存储统计
   */
  async getStorageStats() {
    const response = await fetch(
      `${this.baseUrl}/api/2.0/files/storage`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }
    );
    return await response.json();
  }

  /**
   * 删除到回收站
   */
  async deleteToTrash(fileId) {
    const response = await fetch(
      `${this.baseUrl}/api/2.0/files/file/${fileId}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }
    );
    return await response.json();
  }

  /**
   * 获取回收站内容
   */
  async getTrashbin() {
    const response = await fetch(
      `${this.baseUrl}/api/2.0/files/trashbin`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }
    );
    return await response.json();
  }
}

// 使用示例
const utils = new DocSpaceUtils('http://localhost:8092');

async function demoUtils() {
  // 搜索文件
  const searchResults = await utils.searchFiles('项目');
  console.log('搜索结果:', searchResults);
  
  // 获取收藏
  const favorites = await utils.getFavorites();
  console.log('收藏列表:', favorites);
  
  // 获取存储统计
  const stats = await utils.getStorageStats();
  console.log('存储统计:', stats);
}

demoUtils();
```

---

## 📝 注意事项

1. **搜索限制**: 搜索可能有频率限制
2. **回收站管理**: 回收站文件可能自动清理
3. **标签管理**: 标签支持自定义，注意标签命名规范
4. **存储监控**: 定期检查存储使用情况，避免超容
