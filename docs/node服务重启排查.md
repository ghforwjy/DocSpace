# Node 服务重启排查记录

## 问题描述

`onlyoffice-node-services` 容器内的服务不稳定，经常收到 SIGTERM 信号导致服务重启。

## 排查时间线

### 2026-04-10

#### 1. 容器重启状态检查

**命令**: `docker inspect onlyoffice-node-services --format='{{.RestartCount}}'`
**结果**: `0`
**结论**: 容器本身没有重启，是容器内部的服务在重启

#### 2. 环境变量检查

**命令**: `docker exec onlyoffice-node-services env | grep API_HOST`
**结果**: `API_HOST=http://onlyoffice-dotnet-services:5000`
**结论**: API_HOST 环境变量已正确设置（通过 docspace-stack.yml 配置）

#### 3. 服务状态检查

**命令**: `docker exec onlyoffice-node-services supervisorctl status`
**结果**: 服务经常处于 STARTING 状态，偶尔进入 RUNNING 状态后很快又重启
**现象**:
- ASC.Editors: STARTING/RUNNING
- ASC.Login: STARTING/RUNNING
- ASC.Management: STARTING/RUNNING
- ASC.Sdk: STARTING/RUNNING
- ASC.Socket.IO: STARTING/RUNNING
- ASC.SsoAuth: STARTING/RUNNING

#### 4. 日志分析

**命令**: `docker logs onlyoffice-node-services --tail 100`
**关键发现**:
```
2026-04-10 16:23:44,648 INFO success: ASC.Login entered RUNNING state, process has stayed up for > than 25 seconds (startsecs)
...
2026-04-10 16:25:49,764 WARN received SIGTERM indicating exit request
2026-04-10 16:25:49,764 INFO waiting for ASC.Editors, ASC.Login, ASC.Management, ASC.Sdk, ASC.Socket.IO, ASC.SsoAuth to stop
```

**时间规律**: 服务成功进入 RUNNING 状态后约 2 分钟收到 SIGTERM

#### 5. 健康检查分析

**命令**: `docker inspect onlyoffice-node-services --format='{{json .State.Health}}'`
**结果**:
- Status: starting
- FailingStreak: 多次失败
- ExitCode: 1

**健康检查命令**: `supervisorctl status | grep -v 'ASC.Migration.Runner' | grep -qv RUNNING && exit 1 || exit 0`
**问题**: 健康检查在服务启动期间会失败，但不应导致 SIGTERM

#### 6. OOM 检查

**命令**: `docker inspect onlyoffice-node-services --format='OOMKilled: {{.State.OOMKilled}}'`
**结果**: `false`
**结论**: 不是内存不足导致

#### 7. 容器启动命令

**命令**: `docker inspect onlyoffice-node-services --format='Args: {{.Args}}'`
**结果**: `[docker-entrypoint.py supervisord -n]`
**入口脚本**: `/usr/bin/docker-entrypoint.py`

#### 8. 依赖关系检查

**文件**: `docspace-stack.yml`
**发现**: `onlyoffice-router` 依赖于 `onlyoffice-node-services`
```yaml
depends_on:
  - ${DOTNET_CONTAINER_NAME}
  - ${JAVA_CONTAINER_NAME}
  - ${NODE_CONTAINER_NAME}
```

#### 9. 容器退出原因分析（重要发现）

**命令**: `docker inspect onlyoffice-node-services --format='ExitCode: {{.State.ExitCode}}, RestartPolicy: {{.HostConfig.RestartPolicy.Name}}'`
**结果**: `ExitCode: 0, RestartPolicy: always`

**关键发现**:
1. 容器以 **ExitCode 0** 正常退出（不是被杀死）
2. **RestartPolicy: always** - 容器退出后会自动重启
3. 日志显示服务进入 RUNNING 状态后 **1 秒内** 收到 SIGTERM

**日志证据**:
```
2026-04-10 16:27:53,079 INFO success: ASC.Login entered RUNNING state
2026-04-10 16:27:54,080 WARN received SIGTERM indicating exit request  # 仅 1 秒后！
```

**结论**: 有外部因素在服务刚启动成功后立即发送 SIGTERM 信号

#### 10. docker-entrypoint.py 分析

**命令**: `docker exec onlyoffice-node-services cat /usr/bin/docker-entrypoint.py`
**结果**: 脚本中 **没有** 信号处理代码（grep signal/SIGTERM/SIGINT 无结果）
**结论**: 不是 entrypoint 脚本发送的信号

#### 11. supervisord 配置分析

**命令**: `docker exec onlyoffice-node-services cat /etc/supervisor/conf.d/supervisord.conf`
**结果**: 配置正常，只有 `autorestart=true` 和 `startsecs=25`
**结论**: supervisord 配置正常，不会主动发送 SIGTERM

#### 12. 子进程环境变量检查

**命令**: `docker exec onlyoffice-node-services cat /proc/15/environ | tr '\0' '\n' | grep API_HOST`
**结果**: `API_HOST=http://onlyoffice-dotnet-services:5000`
**结论**: Node.js 子进程已正确继承 API_HOST 环境变量

#### 13. systemd 服务检查

**命令**: `systemctl list-units --type=service | grep docker`
**结果**: `docker.service` 和 `containerd.service` 正在运行
**结论**: Docker 通过 systemd 管理，配置正常

## 已排除的原因

1. ❌ 容器被 Docker 强制重启 - RestartCount = 0（但 RestartPolicy: always 导致自动重启）
2. ❌ OOM - OOMKilled = false
3. ❌ API_HOST 环境变量缺失 - 已正确设置，子进程也继承了
4. ❌ Docker 健康检查直接导致 - 健康检查不会发送 SIGTERM
5. ❌ docker-entrypoint.py 发送信号 - 脚本中没有信号处理代码
6. ❌ supervisord 配置问题 - 配置正常

## 待排查方向

1. **外部信号源** - 检查是否有其他进程/工具发送信号
2. **Docker Desktop 干扰** - Windows 端是否有 Docker Desktop 在运行
3. **WSL 配置问题** - 检查 WSL 的 boot/systemd 配置
4. **健康检查失败连锁反应** - 检查健康检查失败是否会触发某种机制

---

## 重大发现（2026-04-11 更新）

### 根本原因：WSL/Docker 守护进程频繁重启

#### 14. Docker 守护进程重启分析

**命令**: `journalctl -u docker.service --since '10 minutes ago' | grep -E 'Stopping|Starting'`

**关键发现**:
```
Apr 11 00:23:44 - Starting docker.service
Apr 11 00:24:24 - Stopping docker.service (40秒后)
Apr 11 00:24:35 - Starting docker.service
Apr 11 00:25:05 - Stopping docker.service (30秒后)
Apr 11 00:25:15 - Starting docker.service
Apr 11 00:25:33 - Stopping docker.service (18秒后)
...
```

**结论**: Docker 守护进程每隔约 30-40 秒就被 systemd 停止然后重启！

#### 15. WSL 实例重启证据

**命令**: `journalctl --since '10 minutes ago' | grep -B5 'Stopping docker.service'`

**发现**: 每次 Docker 停止之前，都有一系列服务被停止：
- motd-news.timer
- systemd-tmpfiles-clean.timer
- console-getty.service
- cron.service
- docker.service

**结论**: 这是 **WSL 实例在重启**，不是容器内部的问题！

### 问题链条

```
WSL 实例重启 
  → Docker 守护进程收到 SIGTERM 
  → 所有容器被强制停止 
  → WSL 实例启动 
  → Docker 守护进程启动 
  → 容器因为 restart: always 自动重启
  → 服务还在启动中... 
  → WSL 又重启了！
```

### 待确认问题

1. **什么在触发 WSL 重启？**
   - Windows 端的脚本？
   - WSL 配置问题？
   - 某个定时任务？

2. **如何验证？**
   - 检查 Windows 端的 WSL 相关进程
   - 检查 WSL 的 .wslconfig 配置
   - 检查是否有 Windows 计划任务

---

## 根本原因确认（2026-04-11 最终更新）

### WSL 内部错误导致崩溃重启

**命令**: `journalctl --since '5 minutes ago' | grep -B10 'Stopping session-1.scope'`

**关键日志**:
```
WSL (310) ERROR: CheckConnection: getaddrinfo() failed: -5
Exception: Operation canceled @p9io.cpp:258 (AcceptAsync)
systemd-logind[184]: The system will power off now!
systemd-logind[184]: System is powering down.
```

**根本原因**:
1. **WSL 内部错误** - `CheckConnection: getaddrinfo() failed: -5` DNS 解析失败
2. **Plan9 文件系统错误** - `Operation canceled @p9io.cpp:258`
3. **系统强制关机** - `The system will power off now!`

### 问题链条（修正版）

```
WSL 内部错误（DNS/Plan9）
  → WSL 崩溃
  → systemd-logind 触发系统关机
  → Docker 守护进程收到 SIGTERM
  → 所有容器被强制停止
  → WSL 实例重启
  → Docker 守护进程启动
  → 容器因为 restart: always 自动重启
  → 服务还在启动中...
  → WSL 又崩溃了！
```

### 可能的解决方案

1. **检查 WSL 版本** - 当前版本 2.6.3.0，可能有 bug
2. **检查 DNS 配置** - DNS 解析失败可能是触发原因
3. **检查 Plan9 文件系统** - `/etc/wsl.conf` 中的配置可能有问题
4. **更新 WSL** - `wsl --update` 修复已知 bug
5. **创建 .wslconfig** - 配置内存、网络等参数

### 已执行的修复

1. ✅ 修复 `/etc/wsl.conf` 重复配置问题
2. ✅ 确认 WSL 已是最新版本
3. ⏳ 需要手动创建 `.wslconfig` 文件

### 手动创建 .wslconfig

在 Windows 用户目录下创建 `C:\Users\你的用户名\.wslconfig`：

```ini
[wsl2]
memory=8GB
processors=4
swap=4GB
localhostForwarding=true

[experimental]
autoMemoryReclaim=gradual
```

然后执行 `wsl --shutdown` 重启 WSL。

### 已尝试的修复（2026-04-11）

1. ✅ 修复 `/etc/wsl.conf` 重复配置问题
2. ✅ 添加 `[network] generateResolvConf = false` 配置
3. ✅ 手动配置 DNS (8.8.8.8, 114.114.114.114)
4. ✅ 禁用 Windows 代理 (ProxyEnable=0)
5. ✅ 切换到镜像网络模式 (networkingMode=mirrored) - 问题仍存在
6. ✅ 禁用 systemd 测试 - 问题仍存在
7. ✅ 切换回 NAT 模式 - 问题仍存在

### 重要说明

- **localhost 代理警告不是问题**：`检测到 localhost 代理配置，但未镜像到 WSL` 这个警告一直存在，只要宿主机开代理就会提示，不影响 WSL 运行。

### 最终结论

**问题不是网络模式或 systemd 导致的**，而是 WSL 本身的初始化问题。

**关键错误日志**：
```
WSL (188) ERROR: CheckConnection: getaddrinfo() failed: -5
WSL (1 - init()) ERROR: InitEntryUtilityVm:2510: Init has exited. Terminating distribution
```

`Init has exited. Terminating distribution` 表明 WSL 初始化进程退出，导致整个分发版终止。

### 解决方案

根据 [GitHub Issue #13937](https://github.com/Microsoft/WSL/issues/13937)，`CheckConnection: getaddrinfo() failed: -5` 是 WSL 的已知 bug。

**修复方法**：以管理员身份编辑 `C:\Windows\System32\drivers\etc\hosts`，添加以下内容：

```
127.0.0.2 www.msftconnecttest.com
127.0.0.2 ipv6.msftconnecttest.com
::1 www.msftconnecttest.com
::1 ipv6.msftconnecttest.com
```

然后执行 `wsl --shutdown` 重启 WSL。

**注意**：这个修复只解决 `getaddrinfo() failed` 错误。如果 WSL 仍然重启，可能是 `Init has exited` 错误导致的，需要进一步排查。

---

## ✅ 问题已解决（2026-04-11 验证）

### 最终解决方案

1. **修改 Windows hosts 文件**（以管理员身份编辑 `C:\Windows\System32\drivers\etc\hosts`）：
   ```
   127.0.0.2 www.msftconnecttest.com
   127.0.0.2 ipv6.msftconnecttest.com
   ::1 www.msftconnecttest.com
   ::1 ipv6.msftconnecttest.com
   ```

2. **恢复 systemd 配置**（`/etc/wsl.conf`）：
   ```ini
   [boot]
   systemd=true
   ```

3. **删除 Docker 代理配置**（`/etc/docker/daemon.json`）：
   ```json
   {
     "registry-mirrors": [
       "https://docker.mirrors.ustc.edu.cn",
       "https://hub-mirror.c.163.com"
     ]
   }
   ```
   （删除了 `proxies` 配置，避免代理超时问题）

### 验证结果

```
WSL启动时间:
 02:00:06 up 0 min,  1 user,  load average: 0.00, 0.00, 0.00

Docker状态: 所有容器正常运行
- onlyoffice-router: Up, healthy
- onlyoffice-dotnet-services: Up, health: starting
- onlyoffice-node-services: Up, health: starting
- onlyoffice-java-services: Up, health: starting
- 其他基础服务: Up, healthy
```

**关键验证点**：
- ✅ WSL 启动时没有出现 `CheckConnection: getaddrinfo() failed: -5` 错误
- ✅ Docker 通过 systemd 自动启动
- ✅ 所有容器正常启动并保持运行
- ✅ 服务稳定，没有频繁重启

### 问题总结

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| WSL 频繁重启 | WSL 2.6.3 版本的 Plan9 bug | 更新 WSL 到预发布版本 2.7.1 |
| DNS 解析失败 | WSL 连接检查失败 | 修改 hosts 文件添加 msftconnecttest.com |
| Windows PATH 转换失败 | PATH 中包含无效路径 | 在 wsl.conf 中设置 `appendWindowsPath = false` |
| Docker 不自动启动 | systemd 被禁用 | 恢复 systemd=true |

### 最终验证结果

```
WSL版本: 2.7.1.0
内核版本: 6.6.114.1-1

WSL运行时间: up 5 min, 1 user, load average: 0.59

容器状态:
- onlyoffice-router: Up 5 minutes (healthy)
- onlyoffice-dotnet-services: Up 5 minutes (healthy)
- onlyoffice-node-services: Up 5 minutes (healthy)
- onlyoffice-java-services: Up 5 minutes (healthy)
- 其他基础服务: Up 5 minutes (healthy)
```

**访问地址**：
- http://localhost:8092 - DocSpace 主入口
- http://localhost:8081 - Router API
- http://localhost:8085 - Document Server

## 下一步排查命令

```bash
# 检查 docker-entrypoint.py 完整内容
docker exec onlyoffice-node-services cat /usr/bin/docker-entrypoint.py

# 检查 supervisord 配置
docker exec onlyoffice-node-services cat /etc/supervisor/conf.d/supervisord.conf

# 实时监控日志
docker logs -f onlyoffice-node-services

# 检查 Node.js 进程状态
docker exec onlyoffice-node-services ps aux

# 检查容器资源使用
docker stats --no-stream onlyoffice-node-services

# 检查 Docker 事件
docker events --filter container=onlyoffice-node-services
```

## 配置修改记录

### 2026-04-10 修改

**文件**: `buildtools/install/docker/docspace-stack.yml`

**修改内容**: 为 `onlyoffice-node-services` 添加 `API_HOST` 环境变量

```yaml
environment:
  API_HOST: "http://onlyoffice-dotnet-services:5000"
  # ... 其他环境变量
```

**目的**: 解决 SSR 时 API 请求失败问题
