# DocSpace Document Server 检查

## Why

Document Server 已启动，需要根据相关文档检查其状态、日志、以及与其他模块的通信情况。

## What Changes

### 检查范围

1. **Document Server 容器状态检查**
   - 容器是否 healthy
   - 端口映射是否正确
   - 资源使用情况

2. **Document Server 日志检查**
   - 查看启动日志
   - 检查是否有错误
   - 验证 JWT 配置

3. **与其他模块通信检查**
   - .NET 服务（ASC.Files）连接状态
   - JWT 密钥配置一致性
   - API 调用测试

## Impact

- 确认 Document Server 功能是否正常
- 验证文档编辑功能是否可用
- 识别配置问题

## 相关文档

根据 `docs/文档说明.md`：
- `buildtools/install/docker/Readme.md` - Docker 部署配置
- `server/products/ASC.Files/Server/DocStore/README.md` - 文档存储说明

## 检查任务

1. 检查 Document Server 容器状态
2. 检查 Document Server 日志
3. 检查 JWT 配置一致性
4. 测试与其他服务的通信
5. 生成检查报告
