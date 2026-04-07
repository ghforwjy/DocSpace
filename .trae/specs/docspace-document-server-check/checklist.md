# Document Server 检查清单

## 容器状态检查

- [x] Document Server 容器存在
- [x] 容器状态为 running
- [ ] 容器 health 状态为 healthy ❌ (unhealthy)
- [x] 端口映射正确 (8085:80)

## 日志检查

- [x] Document Server 启动日志正常
- [x] 无 error 级别日志
- [x] JWT 配置已加载

## 配置检查

- [x] JWT_SECRET 配置存在
- [x] JWT_SECRET 与其他服务一致 (均为 your_jwt_secret)
- [x] 内部访问地址配置正确

## 通信检查

- [ ] .NET 服务可连接 Document Server ❌ (服务未启动)
- [ ] Document Server API 可访问 ❌ (nginx未运行)
- [ ] Windows 宿主机可访问 Document Server ❌ (返回空)

## 输出

- [x] 检查报告已生成
