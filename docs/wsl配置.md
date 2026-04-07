# WSL Ubuntu 配置记录

## 修改历史

### 2026-04-07 配置更新

#### 第一部分：WSL Ubuntu 安装与迁移

##### 1. 启用WSL功能（Windows终端执行）

```powershell
# 以管理员身份打开PowerShell，执行以下命令
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 重启电脑后，执行以下命令设置WSL默认版本为2
wsl --set-default-version 2
```

##### 2. 安装Ubuntu-24.04（Windows终端执行）

```powershell
# 从Microsoft Store安装（需要登录微软账号）
# 或使用命令行安装
wsl --install -d Ubuntu-24.04

# 安装完成后，首次启动会要求设置用户名和密码
# 用户名：administrator
# 密码：666888
```

##### 3. 检查当前Ubuntu安装位置（Windows终端执行）

```powershell
# 查看所有已安装的WSL发行版
wsl --list -v

# 输出示例：
#   NAME                   STATE           VERSION
# * Ubuntu-24.04          Running         2
#   docker-desktop         Stopped        2

# 查看Ubuntu的安装目录（C:\Users\用户名\AppData\Local\Packages）
dir $env:LOCALAPPDATA\Packages
```

##### 4. 迁移Ubuntu从C盘到D盘

```powershell
# 步骤1：导出Ubuntu为tar文件
wsl --export Ubuntu-24.04 D:\wsl\ubuntu24.tar

# 步骤2：注销当前的Ubuntu（会删除C盘的数据）
wsl --unregister Ubuntu-24.04

# 步骤3：在D盘导入并设置安装位置
wsl --import Ubuntu-24.04 D:\wsl\Ubuntu-24.04 D:\wsl\ubuntu24.tar

# 步骤4：设置默认用户
# 进入Ubuntu设置默认用户
ubuntu24 config --default-user administrator

# 步骤5：验证
wsl --list -v
```

##### 5. 在迁移后的Ubuntu中创建用户并设置密码（Windows终端执行）

```powershell
# 如果首次启动需要创建用户，执行：
wsl -d Ubuntu-24.04 -u root -- bash -c "useradd -m -s /bin/bash administrator && echo 'administrator:666888' | chpasswd && usermod -aG sudo administrator"

# 或者如果已有用户，修改密码：
wsl -d Ubuntu-24.04 -u root -- bash -c "echo 'administrator:666888' | chpasswd"
```

---

#### 第二部分：Docker 安装与配置

##### 6. Docker 安装（完整Windows命令）

```powershell
# 在Windows终端执行：安装Docker和Docker Compose
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S apt update && echo 666888 | sudo -S apt install -y docker.io docker-compose-v2"
```

##### 7. 将用户添加到docker组

```powershell
# 在Windows终端执行：添加用户到docker组
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S usermod -aG docker administrator"
```

##### 8. Docker镜像加速器配置

```powershell
# 步骤1：在Windows创建配置文件
# 创建 E:\mycode\DocSpace\daemon.json 内容如下：
@"
{
  ""registry-mirrors"": [
    ""https://docker.mirrors.ustc.edu.cn"",
    ""https://hub-mirror.c.163.com""
  ]
}
"@ | Out-File -FilePath E:\mycode\DocSpace\daemon.json -Encoding UTF8

# 步骤2：复制到WSL Ubuntu
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S cp /mnt/e/mycode/DocSpace/daemon.json /etc/docker/daemon.json"

# 步骤3：验证配置
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cat /etc/docker/daemon.json"
```

##### 9. Docker网络创建

```powershell
# 在Windows终端执行：创建Docker外部网络
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S docker network create onlyoffice 2>/dev/null || echo 'Network already exists'"
```

##### 10. Docker服务启动

```powershell
# 在Windows终端执行：启动Docker服务
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S pkill dockerd 2>/dev/null; sleep 2; echo 666888 | sudo -S dockerd > /tmp/dockerd.log 2>&1 &"

# 等待Docker启动后，使用newgrp刷新组权限
wsl -d Ubuntu-24.04 -u administrator -- bash -c "newgrp docker << 'EOF'
docker ps
EOF"
```

##### 11. Docker Compose启动基础设施服务

```powershell
# 在Windows终端执行：启动MySQL、Redis、RabbitMQ
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && newgrp docker << 'EOF'
echo 666888 | sudo -S docker compose -f db.yml -f redis.yml -f rabbitmq.yml up -d
EOF"
```

##### 12. 拉取并启动聚合模式

```powershell
# 拉取镜像
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && docker compose -f docspace-stack.yml pull"

# 启动服务（不带端口映射，Windows无法直接访问）
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && docker compose -f docspace-stack.yml up -d"
```

##### 13. 查看服务状态

```powershell
# 在Windows终端执行：查看运行中的容器
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker ps"

# 查看特定容器日志
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker logs -f onlyoffice-router"
```

---

#### 第三部分：端口映射配置（Windows访问）

##### 14. 为什么需要端口映射

**重要概念**：
- Docker的`expose`指令：只在Docker内部网络暴露端口，**Windows宿主机无法直接访问**
- Docker的`ports`指令：将容器端口映射到Windows宿主机，**Windows才能访问**

默认的`docspace-stack.yml`只配置了`expose`，所以Windows无法通过localhost访问服务。

##### 15. 创建端口映射配置文件

在 `buildtools/install/docker/` 目录创建 `docspace-ports.yml`：

```powershell
# 在Windows终端执行：创建端口映射配置
@"
services:
  onlyoffice-router:
    ports:
      - ""8081:8081""
      - ""8092:8092""
      - ""8099:8099""

  onlyoffice-dotnet-services:
    ports:
      - ""8050:5050""

  onlyoffice-java-services:
    ports:
      - ""8051:5050""

  onlyoffice-node-services:
    ports:
      - ""8052:5050""
}
"@ | Out-File -FilePath E:\mycode\DocSpace\buildtools\install\docker\docspace-ports.yml -Encoding UTF8
```

##### 16. 使用端口映射启动服务

```powershell
# 使用端口映射启动聚合模式
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && docker compose -f docspace-stack.yml -f docspace-ports.yml up -d"
```

##### 17. 验证Windows访问

```powershell
# 在Windows终端执行：测试访问
Invoke-WebRequest -Uri "http://localhost:8092" -UseBasicParsing -TimeoutSec 10

# 成功响应：StatusCode = 200
```

---

## 核心要点总结

### Windows执行WSL命令的标准格式

**带密码的WSL命令格式：**
```powershell
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 密码 | sudo -S 命令"
```

**需要刷新docker组权限的格式：**
```powershell
wsl -d Ubuntu-24.04 -u administrator -- bash -c "newgrp docker << 'EOF'
docker 命令
EOF"
```

**需要cd到目录并使用docker compose的格式：**
```powershell
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && newgrp docker << 'EOF'
echo 666888 | sudo -S docker compose -f db.yml up -d
EOF"
```

### 重要注意事项

1. **sudo密码传递**：必须使用 `echo 密码 | sudo -S` 格式，自动化执行时不能省略密码
2. **newgrp刷新组权限**：将用户添加到docker组后，必须使用newgrp刷新组权限才能正常执行docker命令
3. **使用heredoc时**：结束标记EOF必须单独一行，前面不能有空格
4. **Windows路径转换**：Windows的 `E:\mycode\DocSpace` 在WSL中为 `/mnt/e/mycode/DocSpace`
5. **Docker Desktop问题**：WSL中安装的docker.io与Windows版Docker Desktop可能冲突，如使用Docker Desktop则无需在WSL中安装docker.io
6. **端口映射必须**：默认配置只有`expose`，Windows无法访问，必须使用`-f docspace-ports.yml`添加`ports`映射

---

## 常见问题

### Q1: sudo命令需要密码导致自动化失败
```powershell
# 解决方案：使用 echo 密码 | sudo -S 传递密码
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S apt update"
```

### Q2: Docker permission denied
```powershell
# 原因：用户虽然在docker组但未刷新组权限
# 解决方案：使用 newgrp docker 刷新组权限
wsl -d Ubuntu-24.04 -u administrator -- bash -c "newgrp docker << 'EOF'
docker ps
EOF"
```

### Q3: Docker拉取镜像超时
```powershell
# 检查代理连通性
wsl -d Ubuntu-24.04 -u administrator -- bash -c "curl -x http://127.0.0.1:7897 --connect-timeout 5 -s -o /dev/null -w '%{http_code}' https://www.google.com"

# 配置Docker镜像加速器（见上文配置步骤3）
```

### Q4: network declared as external, but could not be found
```powershell
# 解决方案：先创建网络
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S docker network create onlyoffice"
```

### Q5: heredoc语法错误
```powershell
# 错误写法（结束标记前有空格）：
# ENDGRP

# 正确写法（结束标记单独一行）：
# ENDGRP

# heredoc内部命令的执行结果会在退出heredoc后显示
```

### Q6: WSL安装后首次登录要求创建用户
```powershell
# 解决方案：设置默认用户
# 方法1：使用ubuntu24 config命令（如果可用）
ubuntu24 config --default-user administrator

# 方法2：直接用root登录创建用户
wsl -d Ubuntu-24.04 -u root -- bash -c "useradd -m -s /bin/bash administrator && echo 'administrator:666888' | chpasswd && usermod -aG sudo administrator"
```

### Q7: 迁移后Ubuntu无法启动
```powershell
# 检查导出导入是否成功
wsl --list -v

# 如果状态异常，尝试重新导入
wsl --export Ubuntu-24.04 D:\wsl\ubuntu24_backup.tar
wsl --unregister Ubuntu-24.04
wsl --import Ubuntu-24.04 D:\wsl\Ubuntu-24.04 D:\wsl\ubuntu24_backup.tar
ubuntu24 config --default-user administrator
```

### Q8: Windows无法访问localhost:8092
```powershell
# 原因：默认配置只有expose，没有ports映射
# 解决方案：使用端口映射配置文件
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && docker compose -f docspace-stack.yml -f docspace-ports.yml up -d"
```

---

## 代理配置说明

### Windows宿主机信息
- 代理端口：7897
- Windows宿主机IP：192.168.2.113
- WSL默认网关：192.168.2.1

### WSL中测试代理
```powershell
# 测试代理连通性
wsl -d Ubuntu-24.04 -u administrator -- bash -c "curl -x http://127.0.0.1:7897 --connect-timeout 5 -s -o /dev/null -w '%{http_code}' https://www.google.com"
# 输出200表示代理可用
```

### 重要发现
1. **daemon.json中的proxies配置**：这个配置是为Docker Client配置代理，不是为Docker Daemon配置。Docker拉取镜像时使用的是registry-mirrors（镜像加速器）。

2. **WSL代理访问**：WSL2在NAT模式下，无法直接访问Windows的127.0.0.1代理（除非代理开启Allow LAN）。

3. **镜像加速器生效**：由于配置了国内镜像加速器，实际拉取镜像时不需要代理也能正常工作。

4. **expose vs ports**：Docker的`expose`只在内部网络暴露，Windows无法访问；必须使用`ports`映射才能让Windows访问服务。

---

## 当前配置状态

| 配置项 | 值 |
|--------|-----|
| WSL发行版 | Ubuntu-24.04 |
| WSL安装位置 | D:\wsl\Ubuntu-24.04 |
| Docker版本 | 28.2.2 |
| Docker Compose版本 | 2.37.1 |
| Windows宿主机代理 | 127.0.0.1:7897 |
| Docker镜像加速器 | ustc.edu.cn, hub-mirror.c.163.com |
| Docker用户组 | administrator已加入docker组 |
| 端口映射配置 | docspace-ports.yml |

---

## 部署命令速查

### 启动所有服务（带端口映射，Windows可访问）
```powershell
# 1. 启动Docker（如未运行）
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S pkill dockerd 2>/dev/null; sleep 2; echo 666888 | sudo -S dockerd > /tmp/dockerd.log 2>&1 &"

# 2. 创建网络
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S docker network create onlyoffice 2>/dev/null || echo 'Network exists'"

# 3. 启动基础设施
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && newgrp docker << 'EOF'
echo 666888 | sudo -S docker compose -f db.yml -f redis.yml -f rabbitmq.yml up -d
EOF"

# 4. 启动聚合模式（带端口映射）
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && docker compose -f docspace-stack.yml -f docspace-ports.yml up -d"

# 5. 查看状态
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker ps"
```

### 查看日志
```powershell
# 查看router日志
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker logs -f onlyoffice-router"

# 查看dotnet服务日志
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker logs -f onlyoffice-dotnet-services"
```

### 停止所有服务
```powershell
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && docker compose -f docspace-stack.yml down"
```

### Windows访问地址
```powershell
# DocSpace主入口
http://localhost:8092

# API入口
http://localhost:8081
```

### 端口映射说明
| 容器端口 | 宿主机端口 | Windows访问地址 |
|---------|-----------|----------------|
| 8092 | 8092 | http://localhost:8092 |
| 8081 | 8081 | http://localhost:8081 |
| 8099 | 8099 | http://localhost:8099 |
| 5050 | 8050 | http://localhost:8050 |
| 5050 | 8051 | http://localhost:8051 |
| 5050 | 8052 | http://localhost:8052 |
