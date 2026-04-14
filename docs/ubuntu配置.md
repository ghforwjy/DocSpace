# Ubuntu 配置记录

> **路径占位符说明**
>
> - `<项目根目录>`：DocSpace项目根目录路径，如 `/home/ubuntu/EasyDocs/DocSpace`

## 修改历史

### 2026-04-13 配置更新

#### 第一部分：Ubuntu 系统准备

##### 1. 更新系统包

```bash
sudo apt update && sudo apt upgrade -y
```

##### 2. 安装基础工具

```bash
sudo apt install -y curl wget git vim
```

***

#### 第二部分：Docker 安装与配置

##### 3. Docker 安装

```bash
sudo apt install -y docker.io docker-compose-v2
```

##### 3.1 Docker安装位置说明

**Ubuntu中Docker位置：**

- 可执行文件：`/usr/bin/docker`
- 配置文件目录：`/etc/docker/`
- Docker根目录：`/var/lib/docker`
- 服务文件：`/usr/lib/systemd/system/docker.service`

##### 4. 将当前用户添加到docker组

```bash
sudo usermod -aG docker $USER

# 刷新组权限
newgrp docker
```

##### 5. Docker镜像加速器配置

```bash
# 创建配置文件
sudo mkdir -p /etc/docker

cat << 'EOF' | sudo tee /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

# 重启Docker服务
sudo systemctl restart docker
```

##### 6. Docker网络创建

```bash
docker network create onlyoffice 2>/dev/null || echo 'Network already exists'
```

##### 7. Docker服务启动

```bash
# 重启Docker服务
sudo systemctl restart docker

# 验证Docker运行状态
docker ps
```

##### 8. Docker Compose启动基础设施服务

```bash
cd <项目根目录>/buildtools/install/docker

docker compose -f db.yml -f redis.yml -f rabbitmq.yml up -d
```

##### 9. 拉取并启动聚合模式

```bash
# 拉取镜像
cd <项目根目录>/buildtools/install/docker
docker compose -f docspace-stack.yml pull

# 启动服务（不带端口映射）
docker compose -f docspace-stack.yml up -d
```

##### 9.1 验证 ASC.Socket.IO 和 ASC.SsoAuth 服务状态

**重要**：首次部署后，ASC.Socket.IO 和 ASC.SsoAuth 服务可能因配置问题处于 FATAL 状态，需要检查并修复。

```bash
docker exec onlyoffice-node-services supervisorctl status
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

```bash
docker exec -it onlyoffice-node-services /bin/bash
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

```bash
docker exec onlyoffice-node-services supervisorctl reread
docker exec onlyoffice-node-services supervisorctl update
```

1. **验证服务状态**

```bash
# 等待30秒让服务完全启动
sleep 30

# 再次检查服务状态
docker exec onlyoffice-node-services supervisorctl status
```

**修复说明**：

- `PATH_TO_CONF` 必须是**目录路径** `/app/onlyoffice/config`，不能是文件路径
- `--app.host=0.0.0.0` 让服务监听所有网络接口，允许Router容器访问
- 此问题根因：`buildtools/install/docker/config/supervisor/node_services.conf` 中的配置有误（已在源码中修复）

##### 10. 查看服务状态

```bash
# 查看运行中的容器
docker ps

# 查看特定容器日志
docker logs -f onlyoffice-router
```

***

#### 第三部分：端口映射配置

##### 11. 为什么需要端口映射

**重要概念**：

- Docker的`expose`指令：只在Docker内部网络暴露端口，**外部无法直接访问**
- Docker的`ports`指令：将容器端口映射到宿主机，**才能从外部访问**

默认的`docspace-stack.yml`只配置了`expose`，所以外部无法通过localhost访问服务。

##### 12. 创建端口映射配置文件

在 `buildtools/install/docker/` 目录创建 `docspace-ports.yml`：

```bash
cat << 'EOF' > <项目根目录>/buildtools/install/docker/docspace-ports.yml
services:
  onlyoffice-router:
    ports:
      - "8081:8081"
      - "8092:8092"
      - "8099:8099"

  onlyoffice-dotnet-services:
    ports:
      - "8050:5050"

  onlyoffice-java-services:
    ports:
      - "8051:5050"

  onlyoffice-node-services:
    ports:
      - "8052:5050"
EOF
```

##### 13. 使用端口映射启动服务

```bash
cd <项目根目录>/buildtools/install/docker

docker compose -f docspace-stack.yml -f docspace-ports.yml up -d
```

##### 14. 验证访问

```bash
curl -f http://localhost:8092 -UseBasicParsing -TimeoutSec 10

# 成功响应：StatusCode = 200
```

##### 15. 启动Document Server（文档编辑服务）

Document Server是独立外部服务，需要单独启动。它被后端服务调用来处理文档编辑，用户不直接访问。

**步骤1：配置Docker代理（需要从docker.io拉取大镜像）**

```bash
cat << 'EOF' | sudo tee /etc/docker/daemon.json
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
EOF

# 重启Docker
sudo systemctl restart docker

# 验证代理配置
sleep 6
docker info 2>/dev/null | grep -i proxy
```

**步骤2：修改docker-compose.yml配置（重要）**

DocumentServer默认使用PostgreSQL，但DocSpace环境提供的是MySQL，必须修改配置才能正常连接。

```bash
# 编辑docker-compose.yml文件
vim <项目根目录>/Docker-DocumentServer/docker-compose.yml
```

**需要修改的内容**：

| 配置项      | 修改前        | 修改后              |
| -------- | ---------- | ---------------- |
| DB\_TYPE | postgres   | mysql            |
| DB\_PORT | 5432       | 3306             |
| DB\_NAME | onlyoffice | docspace         |
| DB\_USER | onlyoffice | onlyoffice\_user |
| DB\_PASS | onlyoffice | onlyoffice\_pass |

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

```bash
cd <项目根目录>/Docker-DocumentServer
docker compose up -d
```

**步骤4：配置SSL证书和启用443端口（可选，仅使用HTTPS时需要）**

如果需要使用HTTPS连接DocumentServer（如 `https://onlyoffice-document-server:443/`），需要配置SSL证书。

**步骤4.1：生成自签名SSL证书**

```bash
# 创建证书目录
docker exec onlyoffice-documentserver mkdir -p /etc/onlyoffice/documentserver/ssl

# 生成自签名证书（有效期365天）
docker exec onlyoffice-documentserver openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/onlyoffice/documentserver/ssl/self.key -out /etc/onlyoffice/documentserver/ssl/self.crt -subj '/CN=onlyoffice-document-server'
```

**步骤4.2：上传SSL nginx配置文件**

```bash
# 确认本地配置文件存在：<项目根目录>/temp/ds-ssl.conf
# 注意：配置文件中 secure_link_secret 已设置为 M4B6P9CJAnDznMatc3KC

# 上传配置文件到容器
cat <项目根目录>/temp/ds-ssl.conf | docker exec -i onlyoffice-documentserver tee /etc/nginx/conf.d/ds-ssl.conf

# 删除旧的HTTP配置
docker exec onlyoffice-documentserver rm -f /etc/nginx/conf.d/ds.conf
```

**步骤4.3：测试并重载nginx**

```bash
# 测试nginx配置
docker exec onlyoffice-documentserver nginx -t

# 重载nginx使配置生效
docker exec onlyoffice-documentserver nginx -s reload
```

**步骤4.4：验证443端口**

```bash
# 检查端口监听状态
docker exec onlyoffice-documentserver ss -tlnp | grep -E '443|80'
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

```bash
# 1. 创建本地目录用于挂载
mkdir -p <项目根目录>/Docker-DocumentServer/data/ssl <项目根目录>/Docker-DocumentServer/data/nginx-conf

# 2. 拷贝容器中的SSL证书到本地目录
docker cp onlyoffice-documentserver:/etc/onlyoffice/documentserver/ssl/. <项目根目录>/Docker-DocumentServer/data/ssl/

# 3. 拷贝容器中的nginx SSL配置到本地目录
docker cp onlyoffice-documentserver:/etc/nginx/conf.d/ds-ssl.conf <项目根目录>/Docker-DocumentServer/data/nginx-conf/

# 4. 验证文件已拷贝
ls -la <项目根目录>/Docker-DocumentServer/data/ssl/ <项目根目录>/Docker-DocumentServer/data/nginx-conf/
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

```bash
# 查看容器状态
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# 验证DocumentServer健康检查
curl -f http://localhost:8085/healthcheck 2>/dev/null && echo 'OK' || echo 'Not Ready'
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

```bash
# 查看所有环境变量
cat <项目根目录>/buildtools/install/docker/.env

# 验证关键变量是否正确设置
docker exec onlyoffice-router env | grep -E 'SERVICE_|DOCUMENT_'

# 检查nginx upstream配置是否正确
docker exec onlyoffice-router cat /etc/nginx/conf.d/upstream.conf
```

### Ubuntu执行命令的标准格式

**带sudo的命令格式：**

```bash
sudo apt update
```

**使用docker compose的格式：**

```bash
cd <项目根目录>/buildtools/install/docker
docker compose -f db.yml up -d
```

### 重要注意事项

1. **sudo权限**：执行系统级操作时需要使用sudo
2. **newgrp刷新组权限**：将用户添加到docker组后，必须使用newgrp刷新组权限才能正常执行docker命令
3. **端口映射必须**：默认配置只有`expose`，外部无法访问，必须使用`-f docspace-ports.yml`添加`ports`映射

***

## 常见问题

### Q1: Docker permission denied

```bash
# 原因：用户未在docker组或未刷新组权限
# 解决方案：添加用户到docker组并刷新
sudo usermod -aG docker $USER
newgrp docker
```

### Q2: Docker拉取镜像超时

```bash
# 检查网络连通性
curl --connect-timeout 5 -s -o /dev/null -w '%{http_code}' https://www.google.com

# 配置Docker镜像加速器（见上文配置步骤5）
```

### Q3: network declared as external, but could not be found

```bash
# 解决方案：先创建网络
docker network create onlyoffice
```

### Q4: Ubuntu无法访问localhost:8092

```bash
# 原因：默认配置只有expose，没有ports映射
# 解决方案：使用端口映射配置文件
cd <项目根目录>/buildtools/install/docker
docker compose -f docspace-stack.yml -f docspace-ports.yml up -d
```

### Q5: Docker服务未运行

```bash
# 重启Docker服务
sudo systemctl restart docker

# 检查服务状态
sudo systemctl status docker
```

***

## 代理配置说明

### Ubuntu下访问宿主机代理

#### 问题背景

如果Ubuntu运行在虚拟机或远程服务器上，需要通过代理访问外网。

#### 解决步骤

**步骤1：确认代理地址**

如果是本地虚拟机，代理地址通常是宿主机IP：

```bash
# 查看本机IP
ip addr show

# 查看默认网关（可能是代理地址）
ip route | grep default
```

**步骤2：配置Docker使用代理**

```bash
cat << 'EOF' | sudo tee /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "proxies": {
    "http-proxy": "http://<代理IP>:<代理端口>",
    "https-proxy": "http://<代理IP>:<代理端口>",
    "no-proxy": "localhost,127.0.0.1,.local"
  }
}
EOF

# 重启Docker服务
sudo systemctl restart docker

# 验证代理配置
docker info 2>/dev/null | grep -i proxy
```

#### 关键要点

1. **代理地址**：如果是本地虚拟机，使用宿主机的IP作为代理地址
2. **代理监听地址**：代理软件必须监听`0.0.0.0`（所有接口），而不仅是`127.0.0.1`
3. **验证方法**：使用`curl -x http://<代理IP>:<端口> --connect-timeout 5 https://www.google.com`测试

#### 常见问题

**Q: 代理软件已开启LAN访问，但Ubuntu仍无法连接**

- 检查防火墙是否阻止了该端口
- 尝试临时关闭防火墙测试：`sudo ufw disable`

**Q: 配置后Docker拉取镜像仍超时**

- 优先使用国内镜像加速器（已配置ustc和163镜像）
- 查看Docker日志：`sudo journalctl -u docker -f`

***

## 当前配置状态

| 配置项              | 值                                 |
| ---------------- | --------------------------------- |
| 操作系统             | Ubuntu                            |
| Docker版本         | 系统安装的docker.io                |
| Docker Compose版本 | v2                                 |
| 代理地址             | 127.0.0.1:1080                     |
| Docker镜像加速器      | ustc.edu.cn, hub-mirror.c.163.com |
| Docker用户组        | 当前用户已加入docker组                  |
| 端口映射配置           | docspace-ports.yml                |

***

## 部署命令速查

### 启动所有服务（带端口映射，可访问）

**重要**：启动服务前必须确认 `.env` 中 `DOCKER_TAG=latest`，否则可能启动错误的镜像。

```bash
# 0. 确认 .env 中 DOCKER_TAG=latest（不是 dev）
cd <项目根目录>/buildtools/install/docker
grep DOCKER_TAG .env

# 1. 启动Docker（如未运行）
sudo systemctl restart docker

# 2. 创建网络
docker network create onlyoffice 2>/dev/null || echo 'Network exists'

# 3. 启动基础设施
cd <项目根目录>/buildtools/install/docker
docker compose -f db.yml -f redis.yml -f rabbitmq.yml up -d

# 4. 启动聚合模式（带端口映射）
docker compose -f docspace-stack.yml -f docspace-ports.yml up -d

# 5. 查看状态
docker ps
```

### 查看日志

```bash
# 查看router日志
docker logs -f onlyoffice-router

# 查看dotnet服务日志
docker logs -f onlyoffice-dotnet-services
```

### 停止所有服务

```bash
cd <项目根目录>/buildtools/install/docker
docker compose -f docspace-stack.yml down
```

### 访问地址

```bash
# DocSpace主入口
http://localhost:8092

# API入口
http://localhost:8081
```

### 端口映射说明

| 容器端口 | 宿主机端口 | 访问地址                    | 说明                    |
| ---- | ----- | ----------------------- | --------------------- |
| 8092 | 8092  | http://localhost:8092   | DocSpace主入口（Router）   |
| 8081 | 8081  | http://localhost:8081   | API入口                 |
| 8099 | 8099  | http://localhost:8099  | 备用入口                  |
| 5050 | 8050  | http://localhost:8050  | dotnet内部服务            |
| 5050 | 8051  | http://localhost:8051  | java内部服务              |
| 5050 | 8052  | http://localhost:8052  | node内部服务              |
| 80   | 8085  | http://localhost:8085  | Document Server HTTP   |
| 443  | 8443  | https://localhost:8443  | Document Server HTTPS  |

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
cd <项目根目录>/buildtools/install/docker

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
    - /home/ubuntu/EasyDocs/DocSpace/client:/var/www/products/ASC.Management/management:rw
```

#### 2. 配置代理（如果需要）

容器内访问外网需要通过宿主机代理：

```bash
# 测试代理连通性（替换 <代理IP> 和 <代理端口>）
curl -x http://<代理IP>:<代理端口> --connect-timeout 10 https://www.google.com
```

#### 3. 启动容器

```bash
cd <项目根目录>/buildtools/install/docker

# 启动 node-services 容器（带源码映射）
docker compose -f docspace-stack.yml -f docspace-ports.yml up -d onlyoffice-node-services
```

#### 4. 进入容器

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
    - /home/ubuntu/EasyDocs/DocSpace/client:/var/www/products/ASC.Management/management:rw
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
