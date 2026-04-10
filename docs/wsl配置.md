# WSL Ubuntu 配置记录

> **路径占位符说明**
>
> - `<项目根目录>`：Windows下DocSpace项目根目录路径，如 `E:\mycode\DocSpace`
> - `<项目根目录在WSL中的路径>`：同一目录在WSL中的路径，如 `/mnt/e/mycode/DocSpace`

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

***

#### 第二部分：Docker 安装与配置

##### 6. Docker 安装（完整Windows命令）

```powershell
# 在Windows终端执行：安装Docker和Docker Compose
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S apt update && echo 666888 | sudo -S apt install -y docker.io docker-compose-v2"
```

##### 6.1 Docker安装位置说明

**WSL中Ubuntu的Docker位置：**

- 可执行文件：`/usr/bin/docker`
- 配置文件目录：`/etc/docker/`
- Docker根目录：`/var/lib/docker`
- 服务文件：`/usr/lib/systemd/system/docker.service`

**与Windows Docker的区别：**

- WSL中的Docker运行在Linux环境中，独立于Windows的Docker Desktop
- 两个Docker实例使用不同的配置和数据存储
- 版本可能不同（WSL中为28.2.2，Windows中为27.4.0）

##### 7. 将用户添加到docker组

```powershell
# 在Windows终端执行：添加用户到docker组
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S usermod -aG docker administrator"
```

##### 8. Docker镜像加速器配置

```powershell
# 步骤1：在Windows创建配置文件
# 创建 <项目根目录>/daemon.json 内容如下：
@"
{
  ""registry-mirrors"": [
    ""https://docker.mirrors.ustc.edu.cn"",
    ""https://hub-mirror.c.163.com""
  ]
}
"@ | Out-File -FilePath "<项目根目录>/daemon.json" -Encoding UTF8

# 步骤2：复制到WSL Ubuntu
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S cp <项目根目录在WSL中的路径>/daemon.json /etc/docker/daemon.json"

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
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/buildtools/install/docker && newgrp docker << 'EOF'
echo 666888 | sudo -S docker compose -f db.yml -f redis.yml -f rabbitmq.yml up -d
EOF"
```

##### 12. 拉取并启动聚合模式

```powershell
# 拉取镜像
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/buildtools/install/docker && docker compose -f docspace-stack.yml pull"

# 启动服务（不带端口映射，Windows无法直接访问）
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/buildtools/install/docker && docker compose -f docspace-stack.yml up -d"
```

##### 12.1 验证 ASC.Socket.IO 和 ASC.SsoAuth 服务状态

**重要**：首次部署后，ASC.Socket.IO 和 ASC.SsoAuth 服务可能因配置问题处于 FATAL 状态，需要检查并修复。

```powershell
# 检查 Node.js 服务状态
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-node-services supervisorctl status"
```

**正常状态应显示**：

```
ASC.Editors                      RUNNING
ASC.Login                        RUNNING
ASC.Management                   RUNNING
ASC.Sdk                          RUNNING
ASC.Socket.IO                    RUNNING
ASC.SsoAuth                      RUNNING
```

**异常状态（FATAL）**：

```
ASC.Socket.IO                    FATAL
ASC.SsoAuth                      FATAL
```

**如果服务FATAL，按以下步骤修复**：

1. **进入容器修改Supervisor配置**

```powershell
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec -it onlyoffice-node-services /bin/bash"
```

1. **在容器内执行修复**（注意：此配置问题已在源码中修复，重新构建镜像后无需此步骤）

```bash
# 修复 PATH_TO_CONF（文件路径改为目录路径）
sed -i 's|PATH_TO_CONF="/app/onlyoffice/config/appsettings.json"|PATH_TO_CONF="/app/onlyoffice/config"|g' /etc/supervisor/conf.d/supervisord.conf

# 给 ASC.Socket.IO 添加 --app.host=0.0.0.0
sed -i 's|command=/usr/local/bin/node server.js --app.port=%(ENV_SERVICE_SOCKET_PORT)s --app.appsettings|command=/usr/local/bin/node server.js --app.port=%(ENV_SERVICE_SOCKET_PORT)s --app.host=0.0.0.0 --app.appsettings|g' /etc/supervisor/conf.d/supervisord.conf

# 给 ASC.SsoAuth 添加 --app.host=0.0.0.0
sed -i 's|command=/usr/local/bin/node app.js --app.port=%(ENV_SERVICE_SSOAUTH_PORT)s --app.appsettings|command=/usr/local/bin/node app.js --app.port=%(ENV_SERVICE_SSOAUTH_PORT)s --app.host=0.0.0.0 --app.appsettings|g' /etc/supervisor/conf.d/supervisord.conf

# 退出容器
exit
```

1. **重新加载Supervisor配置**

```powershell
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-node-services supervisorctl reread"
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-node-services supervisorctl update"
```

1. **验证服务状态**

```powershell
# 等待30秒让服务完全启动
sleep 30

# 再次检查服务状态
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-node-services supervisorctl status"
```

**修复说明**：

- `PATH_TO_CONF` 必须是**目录路径** `/app/onlyoffice/config`，不能是文件路径
- `--app.host=0.0.0.0` 让服务监听所有网络接口，允许Router容器访问
- 此问题根因：`buildtools/install/docker/config/supervisor/node_services.conf` 中的配置有误（已在源码中修复）

##### 13. 查看服务状态

```powershell
# 在Windows终端执行：查看运行中的容器
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker ps"

# 查看特定容器日志
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker logs -f onlyoffice-router"
```

***

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
"@ | Out-File -FilePath "<项目根目录>/buildtools/install/docker/docspace-ports.yml" -Encoding UTF8
```

##### 16. 使用端口映射启动服务

```powershell
# 使用端口映射启动聚合模式
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/buildtools/install/docker && docker compose -f docspace-stack.yml -f docspace-ports.yml up -d"
```

##### 17. 验证Windows访问

```powershell
# 在Windows终端执行：测试访问
Invoke-WebRequest -Uri "http://localhost:8092" -UseBasicParsing -TimeoutSec 10

# 成功响应：StatusCode = 200
```

##### 18. 启动Document Server（文档编辑服务）

Document Server是独立外部服务，需要单独启动。它被后端服务调用来处理文档编辑，用户不直接访问。

**步骤1：配置Docker代理（需要从docker.io拉取大镜像）**

```powershell
# 创建daemon.json配置文件
$daemonJson = @'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "proxies": {
    "http-proxy": "http://127.0.0.1:1080",
    "https-proxy": "http://127.0.0.1:1080",
    "no-proxy": "localhost,127.0.0.1,.local"
  }
}
'@
$daemonJson | Out-File -FilePath "<项目根目录>/daemon.json" -Encoding UTF8

# 复制到WSL并重启Docker
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S cp <项目根目录在WSL中的路径>/daemon.json /etc/docker/daemon.json && echo 666888 | sudo -S pkill dockerd 2>/dev/null; sleep 2; echo 666888 | sudo -S dockerd > /tmp/dockerd.log 2>&1 &"

# 验证代理配置
Start-Sleep -Seconds 6
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker info 2>/dev/null | grep -i proxy"
```

**步骤2：修改docker-compose.yml配置（重要）**

DocumentServer默认使用PostgreSQL，但DocSpace环境提供的是MySQL，必须修改配置才能正常连接。

```powershell
# 编辑docker-compose.yml文件
notepad "<项目根目录>\Docker-DocumentServer\docker-compose.yml"
```

**需要修改的内容**：

| 配置项      | 修改前        | 修改后              |
| -------- | ---------- | ---------------- |
| DB\_TYPE | postgres   | mysql            |
| DB\_PORT | 5432       | 3306             |
| DB\_NAME | onlyoffice | docspace         |
| DB\_USER | onlyoffice | onlyoffice\_user |
| DB\_PASS | onlyoffice | onlyoffice\_pass |

**操作方法**：使用记事本或其他编辑器打开文件，找到 `environment` 部分的上述配置，逐一修改。

**修改后的environment部分示例**：

```yaml
environment:
  - DB_TYPE=mysql
  - DB_HOST=onlyoffice-mysql-server
  - DB_PORT=3306
  - DB_NAME=docspace
  - DB_USER=onlyoffice_user
  - DB_PASS=onlyoffice_pass
  - AMQP_URI=amqp://guest:guest@onlyoffice-rabbitmq:5672/
  - JWT_ENABLED=true
  - JWT_SECRET=DocSpace2024SecureJwtSecretKey123!
  - JWT_HEADER=AuthorizationJwt
  - JWT_IN_BODY=true
```

**步骤3：启动Document Server**

```powershell
# 使用Docker-DocumentServer目录的docker-compose启动
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/Docker-DocumentServer && newgrp docker << 'EOF'
echo 666888 | sudo -S docker compose up -d
EOF"
```

**步骤4：配置SSL证书和启用443端口（可选，仅使用HTTPS时需要）**

如果需要使用HTTPS连接DocumentServer（如 `https://onlyoffice-document-server:443/`），需要配置SSL证书。

**步骤4.1：生成自签名SSL证书**

```powershell
# 创建证书目录
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-documentserver mkdir -p /etc/onlyoffice/documentserver/ssl"

# 生成自签名证书（有效期365天）
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-documentserver openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/onlyoffice/documentserver/ssl/self.key -out /etc/onlyoffice/documentserver/ssl/self.crt -subj '/CN=onlyoffice-document-server'"
```

**步骤4.2：上传SSL nginx配置文件**

```powershell
# 确认本地配置文件存在：<项目根目录>/temp/ds-ssl.conf
# 注意：配置文件中 secure_link_secret 已设置为 M4B6P9CJAnDznMatc3KC

# 上传配置文件到容器
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cat <项目根目录在WSL中的路径>/temp/ds-ssl.conf | docker exec -i onlyoffice-documentserver tee /etc/nginx/conf.d/ds-ssl.conf"

# 删除旧的HTTP配置
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-documentserver rm -f /etc/nginx/conf.d/ds.conf"
```

**步骤4.3：测试并重载nginx**

```powershell
# 测试nginx配置
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-documentserver nginx -t"

# 重载nginx使配置生效
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-documentserver nginx -s reload"
```

**步骤4.4：验证443端口**

```powershell
# 检查端口监听状态
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-documentserver ss -tlnp | grep -E '443|80'"
```

**正常输出应显示**：

```
LISTEN 0 511 0.0.0.0:443 0.0.0.0:* users:(("nginx",pid=xxx,fd=17))
LISTEN 0 511 0.0.0.0:80  0.0.0.0:* users:(("nginx",pid=xxx,fd=6))
```

**重要说明：HTTPS配置后的端口映射关系**

配置SSL证书后，Docker端口映射为：
- **容器内部443端口** → **外部8443端口**（HTTPS）
- **容器内部80端口** → **外部8085端口**（HTTP）

nginx配置会将HTTP请求重定向到HTTPS，因此：
- **8085端口**：HTTP端口，访问时会被重定向到HTTPS
- **8443端口**：HTTPS端口（推荐使用）

**访问地址示例**：
```
# 推荐使用HTTPS（8443端口）
https://localhost:8443/example/editor?fileName=new.docx&userid=uid-1&lang=en

# 8085端口会被nginx重定向到8443的HTTPS
```

**注意**：容器重启后SSL配置会丢失，需要重新执行上述步骤。如需持久化，可修改docker-compose.yml添加volumes挂载。

**步骤4.5：添加volumes挂载实现持久化**

```powershell
# 1. 创建本地目录用于挂载
wsl -d Ubuntu-24.04 -u administrator -- bash -c "mkdir -p <项目根目录在WSL中的路径>/Docker-DocumentServer/data/ssl <项目根目录在WSL中的路径>/Docker-DocumentServer/data/nginx-conf"

# 2. 拷贝容器中的SSL证书到本地目录
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker cp onlyoffice-documentserver:/etc/onlyoffice/documentserver/ssl/. <项目根目录在WSL中的路径>/Docker-DocumentServer/data/ssl/"

# 3. 拷贝容器中的nginx SSL配置到本地目录
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker cp onlyoffice-documentserver:/etc/nginx/conf.d/ds-ssl.conf <项目根目录在WSL中的路径>/Docker-DocumentServer/data/nginx-conf/"

# 4. 验证文件已拷贝
wsl -d Ubuntu-24.04 -u administrator -- bash -c "ls -la <项目根目录在WSL中的路径>/Docker-DocumentServer/data/ssl/ <项目根目录在WSL中的路径>/Docker-DocumentServer/data/nginx-conf/"
```

**修改docker-compose.yml添加volumes**：

```yaml
volumes:
   - ./data/ssl:/etc/onlyoffice/documentserver/ssl
   - ./data/nginx-conf/ds-ssl.conf:/etc/nginx/conf.d/ds-ssl.conf
   - /dev/null:/etc/nginx/conf.d/ds.conf
```

**说明**：
- `./data/ssl:/etc/onlyoffice/documentserver/ssl` - SSL证书持久化
- `./data/nginx-conf/ds-ssl.conf:/etc/nginx/conf.d/ds-ssl.conf` - nginx SSL配置持久化
- `/dev/null:/etc/nginx/conf.d/ds.conf` - 挂载空文件禁用镜像中自带的ds.conf，避免nginx配置重复导致启动失败

添加后重启容器，SSL配置会自动从本地目录加载，无需重新配置。

**步骤5：验证服务状态**

```powershell
# 查看容器状态
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# 验证DocumentServer健康检查
wsl -d Ubuntu-24.04 -u administrator -- bash -c "curl -f http://localhost:8085/healthcheck 2>/dev/null && echo 'OK' || echo 'Not Ready'"
```

***

## 核心要点总结

### 环境变量说明（buildtools/install/docker/.env）

| 变量名 | 作用 | 未设置影响 |
|--------|------|-----------|
| REGISTRY | Docker镜像仓库地址前缀 | 无法指定私有仓库 |
| PRODUCT | 产品名称 | 影响容器名等默认生成值 |
| REPO | 仓库名，默认为${PRODUCT} | 影响镜像路径 |
| STATUS | 状态标签，用于DOCKER_IMAGE_PREFIX | 影响镜像前缀，可能拉取错误镜像 |
| DOCKER_IMAGE_PREFIX | Docker镜像前缀，${STATUS}docspace | 镜像名格式错误 |
| CONTAINER_PREFIX | 容器名前缀，${PRODUCT}- | 容器命名可能不符合预期 |
| SERVICE_PORT | 服务内部通信端口，默认5050 | 服务间无法正确通信 |
| DOCKERFILE | Dockerfile文件名，默认Dockerfile.app | 构建可能失败 |
| VOLUMES_DIR | 卷数据持久化目录 | 日志等数据无法持久化到宿主机 |
| **CONFIG_DIR** | **nginx配置文件目录** | **无法持久化nginx配置，配置修改在容器重启后丢失** |
| APP_DOTNET_ENV | .NET Core环境（Development/Production） | 影响日志级别和调试信息 |
| EXTERNAL_PORT | 外部访问端口 | 影响外部访问方式 |
| UID/GID | 运行用户的ID | 权限问题 |
| EXTRA_HOSTS | 额外hosts映射 | 容器内无法解析某些域名 |
| DOCKER_TAG | 镜像版本，默认latest | 拉取错误版本镜像 |

### 服务相关环境变量

| 变量名 | 作用 | 未设置影响 |
|--------|------|-----------|
| ROUTER_HOST | Router容器名 | Router服务无法被发现 |
| DOCUMENT_CONTAINER_NAME | DocumentServer容器名 | 文档编辑服务连接失败 |
| DOCUMENT_SERVER_URL_EXTERNAL | DocumentServer外部访问地址 | 前端无法加载文档编辑器 |
| REDIS_CONTAINER_NAME | Redis容器名 | 缓存服务无法访问 |
| REDIS_HOST | Redis主机地址 | 缓存功能失效 |
| RABBIT_CONTAINER_NAME | RabbitMQ容器名 | 消息队列无法访问 |

### 文档服务关键变量

| 变量名 | 作用 | 未设置影响 |
|--------|------|-----------|
| DOCUMENT_SERVER_JWT_SECRET | DocumentServer JWT密钥 | 文档服务认证失败，编辑器无法加载 |
| DOCUMENT_SERVER_JWT_HEADER | JWT Header名称 | 认证请求格式错误 |
| DOCUMENT_SERVER_URL_PUBLIC | DocumentServer公共路径 | 前端无法正确调用文档服务 |

### 服务端口变量（影响nginx upstream配置）

| 变量名 | 作用 | 未设置影响 |
|--------|------|-----------|
| SERVICE_API_SYSTEM | API System服务地址 | nginx无法代理到该服务 |
| SERVICE_FILES | 文件服务地址 | 文件上传下载功能失效 |
| SERVICE_API | API服务地址 | API请求无法到达 |
| SERVICE_SSOAUTH | SSO认证服务地址 | 单点登录失败 |
| SERVICE_IDENTITY_API | 身份认证API地址 | 用户认证失败 |
| SERVICE_DOCEDITOR | 文档编辑服务地址 | 文档编辑功能失效 |
| SERVICE_AI | AI服务地址 | AI功能不可用 |

### 数据库相关变量

| 变量名 | 作用 | 未设置影响 |
|--------|------|-----------|
| MYSQL_CONTAINER_NAME | MySQL容器名 | 数据库连接失败 |
| MYSQL_HOST | MySQL主机地址 | 应用无法连接数据库 |
| MYSQL_PORT | MySQL端口 | 连接端口错误 |
| MYSQL_DATABASE | 数据库名 | 数据无法写入正确库 |
| MYSQL_USER/PASSWORD | 数据库用户名密码 | 无法通过认证 |
| RABBIT_URI | RabbitMQ连接URI | 消息队列功能失效 |

### 网络相关变量

| 变量名 | 作用 | 未设置影响 |
|--------|------|-----------|
| NETWORK_NAME | Docker网络名称 | 容器间网络隔离异常 |
| APP_KNOWN_PROXIES | 已知代理IP列表 | 代理环境下IP获取错误 |
| APP_CORE_MACHINEKEY | 机器密钥，用于数据加密 | 安全相关功能异常 |

### 验证环境变量

```powershell
# 查看所有环境变量
Get-Content "e:\mycode\DocSpace\buildtools\install\docker\.env"

# 验证关键变量是否正确设置
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S docker exec onlyoffice-router env | grep -E 'SERVICE_|DOCUMENT_'"

# 检查nginx upstream配置是否正确
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-router cat /etc/nginx/conf.d/upstream.conf"
```

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
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/buildtools/install/docker && newgrp docker << 'EOF'
echo 666888 | sudo -S docker compose -f db.yml up -d
EOF"
```

### 重要注意事项

1. **sudo密码传递**：必须使用 `echo 密码 | sudo -S` 格式，自动化执行时不能省略密码
2. **newgrp刷新组权限**：将用户添加到docker组后，必须使用newgrp刷新组权限才能正常执行docker命令
3. **使用heredoc时**：结束标记EOF必须单独一行，前面不能有空格
4. **Windows路径转换**：Windows的 `<项目根目录>` 在WSL中为 `<项目根目录在WSL中的路径>`
5. **Docker Desktop问题**：WSL中安装的docker.io与Windows版Docker Desktop可能冲突，如使用Docker Desktop则无需在WSL中安装docker.io
6. **端口映射必须**：默认配置只有`expose`，Windows无法访问，必须使用`-f docspace-ports.yml`添加`ports`映射

***

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
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/buildtools/install/docker && docker compose -f docspace-stack.yml -f docspace-ports.yml up -d"
```

### Q9: Docker命令连接到Windows Docker Desktop而非WSL Docker

```powershell
# 问题表现：docker ps显示的是Windows Docker Desktop的容器，而非WSL中的容器
# 或者出现 "Cannot connect to the Docker daemon" 错误

# 原因：Docker Desktop会修改WSL中docker的默认context，指向Windows Docker
# 关闭Docker Desktop后，context可能没有正确切回本地

# 解决方法1：检查并切换docker context
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker context ls"
# 确保default前面有*号，如果没有，执行：
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker context use default"

# 解决方法2：如果dockerd无法正常启动，重启WSL
wsl --shutdown

# 验证：重启后检查docker版本
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker version"
# 应该看到 Client 和 Server 版本都是 28.2.2（WSL中的版本）
# 如果Server版本是27.4.0，说明还连接到Windows Docker Desktop
```

### Q10: dockerd启动卡住无法加载容器

```powershell
# 问题表现：dockerd启动时卡住，socket文件无法创建
# 原因：可能是之前在Docker Desktop下创建的容器网络配置无法解析

# 解决方法：重启WSL
wsl --shutdown

# 重启后WSL中的Docker应该能正常启动
```

### Q11: 如何避免Docker Desktop修改WSL中的Docker上下文

```powershell
# 方法1（推荐且有效）：禁用Docker Desktop的WSL集成
# 打开Docker Desktop -> Settings -> Resources -> WSL Integration
# 取消勾选与Ubuntu-24.04的集成
# 这样Docker Desktop就不会影响WSL中的docker命令
# 验证：docker version 的 Server 版本应该是 28.2.2（WSL Docker）

# 方法2：删除desktop-linux上下文（不可靠）
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker context rm desktop-linux"
# 注意：此方法不完全可靠，Docker Desktop启动后仍可能"劫持"docker命令

# 方法3：设置默认context为default
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker context use default"

# 验证设置
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker context ls"
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker version"
# 确保Server版本是28.2.2（WSL Docker），不是27.4.0（Docker Desktop）
```

### Q12: 长期解决方案 - 卸载WSL中的docker.io

```powershell
# 如果主要使用Docker Desktop，可以卸载WSL中独立安装的docker.io
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S apt remove -y docker.io docker-compose-v2"

# 这样就只会使用Docker Desktop的Docker，避免冲突
```

***

## 代理配置说明

### WSL2 NAT模式下访问Windows宿主机代理

#### 问题背景

WSL2 使用 NAT 模式，无法直接访问 Windows 宿主机的 `127.0.0.1`（localhost）。如果代理软件只监听 `127.0.0.1:端口`，WSL 将无法连接。

#### 解决步骤

**步骤1：获取WSL网关IP（Windows宿主机在WSL中的IP）**

```powershell
# 在WSL中查看默认网关，这就是Windows宿主机的IP
wsl -d Ubuntu-24.04 -u administrator -- bash -c "ip route | grep default"
# 输出示例：default via 172.20.128.1 dev eth0
# 则Windows宿主机IP为：172.20.128.1
```

**步骤2：开启代理软件的"允许局域网连接"**

| 代理软件        | 设置位置                                |
| ----------- | ----------------------------------- |
| Shadowsocks | 右键图标 → 服务器 → 编辑服务器 → 勾选"允许来自局域网的连接" |
| Clash       | Settings → Allow LAN                |
| v2rayN      | 参数设置 → 允许来自局域网的连接                   |

**步骤3：验证代理可从WSL访问**

```powershell
# 使用WSL网关IP测试代理连通性（将172.20.128.1替换为实际网关IP）
wsl -d Ubuntu-24.04 -u administrator -- bash -c "curl -x http://172.20.128.1:1080 --connect-timeout 10 -s -o /dev/null -w '%{http_code}' https://www.google.com"
# 输出200表示代理可用
```

**步骤4：配置Docker使用宿主机代理**

```powershell
# 创建daemon.json配置文件（使用实际网关IP）
$daemonJson = @'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "proxies": {
    "http-proxy": "http://172.20.128.1:1080",
    "https-proxy": "http://172.20.128.1:1080",
    "no-proxy": "localhost,127.0.0.1,.local"
  }
}
'@
$daemonJson | Out-File -FilePath "<项目根目录>/daemon.json" -Encoding UTF8

# 复制到WSL
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo '666888' | sudo -S mkdir -p /etc/docker && echo '666888' | sudo -S cp <项目根目录在WSL中的路径>/daemon.json /etc/docker/daemon.json"

# 重启Docker服务
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo '666888' | sudo -S pkill dockerd 2>/dev/null; sleep 2; echo '666888' | sudo -S dockerd > /tmp/dockerd.log 2>&1 &"

# 验证代理配置生效
wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker info 2>/dev/null | grep -i proxy"
```

#### 关键要点

1. **WSL2 NAT模式**：WSL2无法直接访问Windows的`127.0.0.1`，必须通过网关IP访问
2. **代理监听地址**：代理软件必须监听`0.0.0.0`（所有接口），而不仅是`127.0.0.1`
3. **动态IP问题**：WSL网关IP可能在重启后变化，需要重新获取
4. **验证方法**：使用`netstat -an | findstr "1080"`查看代理是否监听`0.0.0.0:1080`

#### 常见问题

**Q: 代理软件已开启LAN访问，但WSL仍无法连接**

- 检查Windows防火墙是否阻止了该端口
- 尝试临时关闭防火墙测试：`netsh advfirewall set allprofiles state off`

**Q: WSL网关IP每次重启都变，如何自动获取**

```bash
# 在WSL中自动获取网关IP
GATEWAY_IP=$(ip route | grep default | awk '{print $3}')
echo $GATEWAY_IP
```

**Q: 配置后Docker拉取镜像仍超时**

- 优先使用国内镜像加速器（已配置ustc和163镜像）
- 检查代理是否支持Docker Hub的HTTPS连接
- 查看Docker日志：`wsl -d Ubuntu-24.04 -u administrator -- bash -c "cat /tmp/dockerd.log"`

***

## 当前配置状态

| 配置项              | 值                                 |
| ---------------- | --------------------------------- |
| WSL发行版           | Ubuntu-24.04                      |
| WSL安装位置          | D:\wsl\Ubuntu-24.04               |
| Docker版本         | 28.2.2                            |
| Docker Compose版本 | 2.37.1                            |
| Windows宿主机代理     | 127.0.0.1:7897                    |
| Docker镜像加速器      | ustc.edu.cn, hub-mirror.c.163.com |
| Docker用户组        | administrator已加入docker组           |
| 端口映射配置           | docspace-ports.yml                |

***

## 部署命令速查

### 启动所有服务（带端口映射，Windows可访问）

**重要**：启动服务前必须确认 `.env` 中 `DOCKER_TAG=latest`，否则可能启动错误的镜像。

```powershell
# 0. 确认 .env 中 DOCKER_TAG=latest（不是 dev）
cd <项目根目录在WSL中的路径>/buildtools/install/docker
grep DOCKER_TAG .env

# 1. 启动Docker（如未运行）
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S pkill dockerd 2>/dev/null; sleep 2; echo 666888 | sudo -S dockerd > /tmp/dockerd.log 2>&1 &"

# 2. 创建网络
wsl -d Ubuntu-24.04 -u administrator -- bash -c "echo 666888 | sudo -S docker network create onlyoffice 2>/dev/null || echo 'Network exists'"

# 3. 启动基础设施
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/buildtools/install/docker && newgrp docker << 'EOF'
echo 666888 | sudo -S docker compose -f db.yml -f redis.yml -f rabbitmq.yml up -d
EOF"

# 4. 启动聚合模式（带端口映射）
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/buildtools/install/docker && docker compose -f docspace-stack.yml -f docspace-ports.yml up -d"

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
wsl -d Ubuntu-24.04 -u administrator -- bash -c "cd <项目根目录在WSL中的路径>/buildtools/install/docker && newgrp docker << 'EOF'
docker compose -f docspace-stack.yml down
EOF"
```

### Windows访问地址

```powershell
# DocSpace主入口
http://localhost:8092

# API入口
http://localhost:8081
```

### 端口映射说明

| 容器端口 | 宿主机端口 | Windows访问地址              | 说明                    |
| ---- | ----- | ------------------------ | --------------------- |
| 8092 | 8092  | <http://localhost:8092>  | DocSpace主入口（Router）   |
| 8081 | 8081  | <http://localhost:8081>  | API入口                 |
| 8099 | 8099  | <http://localhost:8099>  | 备用入口                  |
| 5050 | 8050  | <http://localhost:8050>  | dotnet内部服务            |
| 5050 | 8051  | <http://localhost:8051>  | java内部服务              |
| 5050 | 8052  | <http://localhost:8052>  | node内部服务              |
| 80   | 8085  | <http://localhost:8085>  | Document Server HTTP   |
| 443  | 8443  | <https://localhost:8443> | Document Server HTTPS  |

**注意**：配置HTTPS后，Document Server的8085端口会被nginx重定向到8443的HTTPS，建议直接使用8443端口访问。

## 开发镜像说明

### 概述

开发镜像（`Dockerfile.dev`）是基于 `node:22-slim` 构建的专用开发环境，已安装 pnpm 等编译工具链，支持在容器内直接编译源码。

### 文件位置

- `buildtools/install/docker/Dockerfile.dev` - 开发专用 Dockerfile

### 与生产镜像的区别

| 特性 | 生产镜像 (`Dockerfile.app`) | 开发镜像 (`Dockerfile.dev`) |
|------|--------------------------|--------------------------|
| 基础镜像 | 多阶段构建 | `node:22-slim` |
| 源码 | 无（预编译） | 无（通过 volume 映射） |
| pnpm | 无 | 已安装（v10.20.0） |
| 入口命令 | `python3 docker-entrypoint.py` | `python3 docker-entrypoint.py` |
| 用途 | 生产部署 | 开发调试 |

### 构建开发镜像

**重要**：构建 dev 镜像前必须检查 `.env` 中的 `DOCKER_TAG`，必须使用 `dev` 而非 `latest`，否则会覆盖生产镜像。

```bash
cd <项目根目录在WSL中的路径>/buildtools/install/docker

# 1. 确认 .env 中 DOCKER_TAG=dev（不是 latest）
grep DOCKER_TAG .env

# 2. 修改 docspace-stack.yml，指定使用 Dockerfile.dev
# 在 onlyoffice-node-services 下添加 build 配置：
# build:
#   context: .
#   dockerfile: Dockerfile.dev

# 3. 构建 dev 镜像
docker compose -f docspace-stack.yml build onlyoffice-node-services

# 4. 构建完成后，立即恢复 docspace-stack.yml（移除 build 配置）
# 这样下次启动会用生产镜像 latest

# 5. 启动 dev 容器（需要先在 docspace-ports.yml 中添加 volume 映射，见下文）
docker compose -f docspace-stack.yml -f docspace-ports.yml up -d onlyoffice-node-services
```

**镜像命名规则**：
- 生产镜像：`onlyoffice/docspace-node:latest`
- 开发镜像：`onlyoffice/docspace-node:dev`

### 启用开发容器

#### 1. 配置 volume 映射

在 `docspace-ports.yml` 中添加源码映射：

```yaml
onlyoffice-node-services:
  ports:
    - "8052:5050"
  volumes:
    - /mnt/f/mycode/industry tools/DocSpace/client:/var/www/products/ASC.Management/management:rw
```

#### 3. 配置代理（如果需要）

容器内访问外网需要通过宿主机代理。在 Ubuntu 终端中执行：

```bash
# 确认宿主机网关地址
ip route | grep default | awk '{print $3}'

# 测试代理连通性（替换 <网关IP> 和 <代理端口>）
curl -x http://<网关IP>:<代理端口> --connect-timeout 10 https://www.google.com
```

#### 4. 启动容器

```bash
cd <项目根目录在WSL中的路径>/buildtools/install/docker

# 启动 node-services 容器（带源码映射）
docker compose -f docspace-stack.yml -f docspace-ports.yml up -d onlyoffice-node-services
```

#### 5. 进入容器

```bash
docker exec -it onlyoffice-node-services bash
```

### 在容器内编译代码

#### 1. 设置代理（如果需要）

```bash
export HTTP_PROXY=http://host.docker.internal:1080
export HTTPS_PROXY=http://host.docker.internal:1080
```

#### 2. 安装依赖

```bash
cd /var/www/products/ASC.Management/management
pnpm install
```

#### 3. 编译

```bash
# 编译所有项目
pnpm build

# 或编译特定项目
pnpm nx run @docspace/management:build
```

#### 4. 清理锁文件（如需重新编译）

```bash
rm -rf /var/www/products/ASC.Management/management/packages/*/.next/lock
```

### 源码映射说明

`docspace-ports.yml` 中配置了源码映射：

```yaml
onlyoffice-node-services:
  volumes:
    - /mnt/f/mycode/industry tools/DocSpace/client:/var/www/products/ASC.Management/management:rw
```

这会将本地 `client` 目录映射到容器的 `management` 目录。修改本地源码后，容器内可直接看到变化。

### 停止开发容器

```bash
# 停止容器
docker compose -f docspace-stack.yml -f docspace-ports.yml stop onlyoffice-node-services

# 或删除容器
docker compose -f docspace-stack.yml -f docspace-ports.yml down onlyoffice-node-services
```

### 注意事项

1. **代理配置**：构建镜像时已设置 npm 国内镜像源，运行时如需代理请在命令中指定
2. **首次编译**：首次 `pnpm install` 需要下载大量依赖，确保网络通畅
3. **锁文件**：如果编译失败，先清理 `packages/*/.next/lock` 再重试
4. **资源占用**：编译过程消耗较多 CPU 和内存，确保容器有足够资源

