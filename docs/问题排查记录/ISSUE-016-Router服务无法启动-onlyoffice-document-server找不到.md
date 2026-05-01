# ISSUE-016: Router 服务无法启动 - onlyoffice-document-server 找不到

## 问题基本信息

| 项目 | 内容 |
|------|------|
| 问题编号 | ISSUE-016 |
| 发现时间 | 2026-04-27 |
| 问题类型 | 服务故障 🔴 Blocker |
| 问题状态 | 🔍 排查中 |
| 影响范围 | 无法访问 DocSpace 主入口和 API |

---

## 问题描述

### 错误信息

```
2026/04/27 09:10:31 [emerg] 1#1: host not found in upstream "onlyoffice-document-server" in /etc/nginx/conf.d/onlyoffice.conf:197
nginx: [emerg] host not found in upstream "onlyoffice-document-server" in /etc/nginx.conf:197
```

### 现象

- Router 容器持续重启（Restarting (1) 38 seconds ago）
- 端口 8092 和 8081 无法监听
- 无法通过浏览器访问 DocSpace
- API 请求全部失败

### 影响

| 服务 | 端口 | 状态 |
|------|------|------|
| DocSpace 主入口 | 8092 | ❌ 不可用 |
| API 入口 | 8081 | ❌ 不可用 |
| Node 服务 | 8052 | ✅ 正常 |
| Java 服务 | 8051 | ✅ 正常 |
| .NET 服务 | 8050 | ✅ 正常 |

---

## 排查过程记录

### 阶段1：问题发现

#### 1.1 检查容器状态

```bash
docker ps | grep -E "docspace|router"
```

**结果**: onlyoffice-router 容器状态为 "Restarting"

#### 1.2 检查端口监听

```bash
lsof -i :8092
netstat -tlnp | grep 8092
```

**结果**: 端口 8092 未监听

#### 1.3 检查 API 连通性

```bash
curl -I http://localhost:8092/api/2.0/settings/colortheme
```

**结果**: Connection failed (HTTP Status: 000)

#### 1.4 查看 Router 日志

```bash
docker logs onlyoffice-router --tail 50
```

**结果**: 发现关键错误信息

---

## 根因分析

### 错误分析

```
host not found in upstream "onlyoffice-document-server"
```

这表明 Nginx 配置文件中引用了一个名为 `onlyoffice-document-server` 的 upstream，但该主机在 Docker 网络中不存在。

### 可能原因

| 原因 | 可能性 | 说明 |
|------|--------|------|
| Document Server 容器未运行 | 高 | 容器可能未启动或已停止 |
| Docker 网络配置问题 | 中 | 容器不在同一网络 |
| 主机名配置错误 | 中 | upstream 配置的主机名不正确 |
| DNS 解析问题 | 低 | Docker 内部 DNS 无法解析 |

### 5个为什么分析

1. **为什么 Router 无法启动？** → 因为 Nginx 配置检查失败
2. **为什么 Nginx 配置检查失败？** → 因为 upstream "onlyoffice-document-server" 无法解析
3. **为什么无法解析？** → 该主机在 Docker 网络中不存在
4. **为什么不存在？** → Document Server 容器可能未启动或使用了不同的主机名
5. **为什么？** → 需要检查 Docker 容器列表和网络配置

---

## 解决方案

### 待实施

1. 检查是否存在 Document Server 相关容器
2. 检查 Docker 网络配置
3. 修正 upstream 配置或启动正确的容器

---

## 验证结果

### 待验证

- [ ] Router 容器状态变为 "Up"
- [ ] 端口 8092 正常监听
- [ ] API 请求成功返回

---

## 排查日志

### 2026-04-27 09:20

| 时间 | 事件 | 详情 |
|------|------|------|
| 09:20 | 问题发现 | 运行 API 连通性测试时发现端口 8092 无响应 |
| 09:21 | 容器检查 | docker ps 显示 router 容器重启中 |
| 09:22 | 日志分析 | docker logs 发现 upstream 错误 |
| 09:23 | 根因分析 | onlyoffice-document-server 主机不存在 |

