# DocSpace 服务检查方案

> 本文档定义 DocSpace 生产环境的标准检查流程。
>
> **核心原则**：由里到外，先检查容器内部，再检查外部。

---

## 1. 检查顺序

### 1.1 标准检查顺序（由里到外）

```
第一步：容器内部检查（docker exec）
    ↓
第二步：Ubuntu主机检查（docker ps / ss / netstat）
    ↓
第三步：宿主机检查（Windows）
```

### 1.2 核心容器列表

| 容器名 | 镜像 | 内部端口 | 外部端口 |
|--------|------|----------|----------|
| onlyoffice-router | onlyoffice/docspace-router:latest | 8092 | 8092 |
| onlyoffice-node-services | onlyoffice/docspace-node:latest | 5050 | 8052 |
| onlyoffice-dotnet-services | onlyoffice/docspace-dotnet:latest | 5050 | 8050 |
| onlyoffice-java-services | onlyoffice-docspace-java:latest | 5050 | 8051 |
| onlyoffice-document-server | onlyoffice/documentserver | 80 | 8085 |

---

## 2. 第一步：容器内部检查

### 2.1 检查容器内端口监听状态

```bash
# 检查Router容器内端口
docker exec onlyoffice-router netstat -tlnp | grep 8092

# 检查Node.js容器内端口
docker exec onlyoffice-node-services netstat -tlnp | grep 5050

# 检查.NET容器内端口
docker exec onlyoffice-dotnet-services netstat -tlnp | grep 5050

# 检查Java容器内端口
docker exec onlyoffice-java-services netstat -tlnp | grep 5050
```

**预期结果**：端口应该处于LISTEN状态

### 2.2 检查容器内服务进程

```bash
# Node.js Supervisor服务状态
docker exec onlyoffice-node-services supervisorctl status

# .NET Supervisor服务状态
docker exec onlyoffice-dotnet-services supervisorctl status

# Java Supervisor服务状态
docker exec onlyoffice-java-services supervisorctl status
```

**预期结果**：所有服务应为RUNNING状态，不应有FATAL/EXITED

### 2.3 检查容器内服务连通性（使用Python socket，不卡死）

在容器内执行Python socket测试：

```bash
docker exec onlyoffice-router python3 -c "
import socket
socket.setdefaulttimeout(3)
try:
    s = socket.create_connection(('localhost', 8092), timeout=3)
    s.close()
    print('8092: OK')
except Exception as e:
    print(f'8092: FAIL - {e}')
"
```

---

## 3. 第二步：Ubuntu主机检查

### 3.1 检查Docker端口映射

```bash
docker ps --format '{{.Names}}\t{{.Ports}}'
```

**预期**：能看到 `0.0.0.0:8092->8092/tcp` 这样的映射

### 3.2 检查主机端口监听

```bash
ss -tlnp | grep -E '8092|8052|8050|8051'
```

**预期结果**：
```
tcp  0  0  0.0.0.0:8050  0.0.0.0:*  LISTEN
tcp  0  0  0.0.0.0:8051  0.0.0.0:*  LISTEN
tcp  0  0  0.0.0.0:8052  0.0.0.0:*  LISTEN
tcp  0  0  0.0.0.0:8092  0.0.0.0:*  LISTEN
```

### 3.3 检查Ubuntu内服务连通性

使用Python socket测试（不卡死）：
```bash
python3 -c "
import socket
for port in [8092, 8052, 8050, 8051]:
    try:
        s = socket.create_connection(('localhost', port), timeout=3)
        s.close()
        print(f'{port}: OK')
    except Exception as e:
        print(f'{port}: FAIL - {e}')
"
```

---

## 4. 第三步：宿主机检查（Windows）

### 4.1 检查宿主机端口连通性

**重要**：禁止使用curl（访问不通时会卡死），使用Python socket：

```powershell
python.exe -c "
import socket
for port in [8092, 8052, 8050, 8051]:
    try:
        s = socket.create_connection(('localhost', port), timeout=3)
        s.close()
        print(f'{port}: OK')
    except Exception as e:
        print(f'{port}: FAIL - {e}')
"
```

### 4.2 检查宿主机访问

```powershell
python.exe -c "
import socket
socket.setdefaulttimeout(3)
ports = [8092, 8052, 8050, 8051]
for port in ports:
    try:
        with socket.create_connection(('localhost', port), timeout=3) as s:
            print(f'localhost:{port} -> OK')
    except Exception as e:
        print(f'localhost:{port} -> FAIL: {e}')
"
```

---

## 5. 快速验证脚本

### 5.1 一键容器内部检查

```bash
#!/bin/bash
# 容器内检查脚本
echo "=== 容器内端口监听检查 ==="
for container in onlyoffice-router onlyoffice-node-services onlyoffice-dotnet-services onlyoffice-java-services; do
    echo "--- $container ---"
    docker exec $container netstat -tlnp 2>/dev/null || echo "netstat not available"
done

echo ""
echo "=== 容器内Supervisor状态 ==="
docker exec onlyoffice-node-services supervisorctl status 2>/dev/null
```

---

## 6. 故障排查流程

### 6.1 容器内端口未监听

1. 检查supervisor服务状态
2. 查看容器日志：`docker logs <容器名>`
3. 检查服务启动命令是否正确

### 6.2 容器内监听但Ubuntu主机不通

1. 检查Docker端口映射：`docker ps`
2. 重启容器：`docker compose restart <服务名>`

### 6.3 Ubuntu主机通但宿主机不通

1. 检查Windows防火墙
2. 检查WSL网络配置

---

## 7. 服务状态判定标准

| 层级 | 检查方法 | 正常表现 |
|------|----------|----------|
| 容器内 | netstat -tlnp | 端口LISTEN |
| 容器内 | supervisorctl status | 服务RUNNING |
| Ubuntu内 | ss -tlnp | 端口映射存在 |
| Ubuntu内 | socket.connect | 连接成功 |
| 宿主机 | socket.create_connection | 连接成功 |

**任何一层失败都需要先修复该层，问题不会凭空跳跃到外层。**
