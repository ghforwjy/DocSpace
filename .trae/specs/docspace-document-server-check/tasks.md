# Document Server 检查任务

## 检查任务

- [x] 1: 检查 Document Server 容器状态
  - [x] 1.1: 列出所有容器，找到 Document Server
  - [x] 1.2: 检查容器状态和健康状态
  - [x] 1.3: 检查端口映射

- [x] 2: 检查 Document Server 日志
  - [x] 2.1: 查看启动日志
  - [x] 2.2: 检查是否有错误
  - [x] 2.3: 验证 JWT 配置

- [x] 3: 检查 JWT 配置一致性
  - [x] 3.1: 检查 .env 中 JWT_SECRET
  - [x] 3.2: 检查 Document Server 环境变量
  - [x] 3.3: 验证密钥是否匹配

- [x] 4: 测试与其他服务的通信
  - [x] 4.1: 从 .NET 服务测试 Document Server 连接
  - [x] 4.2: 从 Node.js 服务测试连接
  - [x] 4.3: Windows 宿主机访问测试

- [x] 5: 生成检查报告
  - [x] 5.1: 汇总检查结果
  - [x] 5.2: 识别问题
  - [x] 5.3: 提供建议
