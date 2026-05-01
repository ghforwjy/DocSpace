# EasyDocs 文档版本管理 API 测试

## 系统架构

EasyDocs 使用微服务架构：

- **Router（Nginx）**: http://localhost:8092 (主入口)，8081 (API 入口)
- **Node.js 服务**: 前端静态服务、登录服务
- **Java 服务**: 身份认证服务
- **.NET 服务**: 文件管理服务 (包含版本管理 API)

## 测试文件

- `test_version_api.js` - 完整的 Web 接口模式 API 测试

## 测试覆盖的 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/2.0/files/file/{fileId}/history` | GET | 获取文件版本列表 |
| `/api/2.0/files/file/{fileId}/history` | PUT | 合并/恢复版本 |
| `/api/2.0/files/file/{fileId}/edit/history` | GET | 获取编辑历史 |
| `/api/2.0/files/file/{fileId}/edit/diff` | GET | 获取版本差异 URL |
| `/api/2.0/files/file/{fileId}/restoreversion` | POST | 恢复到指定版本 |
| `/api/2.0/files/file/{fileId}/comment` | PUT | 更新版本注释 |
| `/api/2.0/files/file/{fileId}` | GET | 获取文件信息（带版本号） |
| `/api/2.0/files/file/{fileId}/log` | GET | 获取文件操作历史 |

## 运行测试

### 前置条件

确保 EasyDocs 服务正在运行：

```bash
# 检查容器状态
docker ps
```

### 运行测试

```bash
cd /home/ubuntu/EasyDocs/DocSpace/tests
node test_version_api.js
```

### 测试报告

测试完成后会生成 `test_version_api_report.json` 文件，包含完整的测试结果。

## 测试场景设计

详细测试场景请参考：
`/home/ubuntu/EasyDocs/DocSpace/docs/技术文档/版本管理API测试场景设计.md`

### 主要测试场景

1. 获取文件版本列表
2. 合并版本历史
3. 恢复到指定版本
4. 获取编辑历史
5. 获取版本差异 URL
6. 更新版本注释
7. 获取指定版本的文件信息
8. 获取文件操作历史

## .NET 测试文件

同时提供了 .NET 集成测试（用于后端服务直接测试）：

- `/server/products/ASC.Files/Tests/Tests/05_Features/FileHistoryTests.cs`

## 注意事项

- 部分 API 需要用户认证
- 确保 `http://localhost:8092` 可访问
- 如果是在其他部署环境，修改 `BASE_URL` 配置

## 快速开始

### 1. 检查服务

```bash
# 检查 API 是否响应
curl http://localhost:8092/api/2.0/settings/colortheme
```

### 2. 运行完整测试

```bash
cd /home/ubuntu/EasyDocs/DocSpace/tests
node test_version_api.js
```
