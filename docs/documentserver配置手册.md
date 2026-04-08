# DocumentServer 配置手册

## 一、DocumentServer 官方部署指南

### 1.1 系统要求

- **RAM**: 4 GB 或更多
- **CPU**: 双核 2 GHz 或更高
- **Swap**: 至少 2 GB
- **HDD**: 至少 2 GB 可用空间
- **Docker**: 版本 1.9.0 或更高（推荐 20.10.21+）

### 1.2 基础运行命令

```bash
# 基础运行
sudo docker run -i -t -d -p 80:80 onlyoffice/documentserver

# 带数据卷持久化运行
sudo docker run -i -t -d -p 80:80 \
    -v /app/onlyoffice/DocumentServer/logs:/var/log/onlyoffice  \
    -v /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data  \
    -v /app/onlyoffice/DocumentServer/lib:/var/lib/onlyoffice \
    -v /app/onlyoffice/DocumentServer/db:/var/lib/postgresql  \
    -v /app/onlyoffice/DocumentServer/rabbitmq:/var/lib/rabbitmq \
    -v /app/onlyoffice/DocumentServer/redis:/var/lib/redis \
    onlyoffice/documentserver
```

### 1.3 数据卷说明

| 宿主机路径 | 容器内路径 | 用途 |
|-----------|-----------|------|
| `/app/onlyoffice/DocumentServer/logs` | `/var/log/onlyoffice` | 日志文件 |
| `/app/onlyoffice/DocumentServer/data` | `/var/www/onlyoffice/Data` | 证书存储 |
| `/app/onlyoffice/DocumentServer/lib` | `/var/lib/onlyoffice` | 文件缓存 |
| `/app/onlyoffice/DocumentServer/db` | `/var/lib/postgresql` | 数据库 |
| `/app/onlyoffice/DocumentServer/rabbitmq` | `/var/lib/rabbitmq` | RabbitMQ数据 |
| `/app/onlyoffice/DocumentServer/redis` | `/var/lib/redis` | Redis数据 |

### 1.4 关键配置参数

#### JWT 相关配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `JWT_ENABLED` | `true` | 是否启用JWT验证 |
| `JWT_SECRET` | 随机生成 | JWT签名密钥 |
| `JWT_HEADER` | `Authorization` | JWT头名称 |
| `JWT_IN_BODY` | `false` | 是否在请求体中验证JWT |

#### 插件配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `PLUGINS_ENABLED` | `true` | 是否启用插件功能 |
| `DS_PLUGIN_INSTALLATION` | `false` | 插件安装模式 |

**重要**：插件下载需要访问 GitHub，国内环境可能导致下载卡住。建议在中国使用时设置 `PLUGINS_ENABLED=false` 禁用插件以加快启动速度。

插件目录：`/var/www/onlyoffice/documentserver/sdkjs-plugins/`
- `plugin-list-default.json` - 默认插件列表配置
- `{UUID}/` - 各插件的独立目录
- `marketplace/` - 插件市场

#### 数据库配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `DB_TYPE` | `postgres` | 数据库类型 |
| `DB_HOST` | - | 数据库主机地址 |
| `DB_PORT` | `5432` | 数据库端口 |
| `DB_NAME` | `onlyoffice` | 数据库名 |
| `DB_USER` | - | 数据库用户 |
| `DB_PWD` | - | 数据库密码 |

#### 消息队列配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `AMQP_URI` | `amqp://guest:guest@localhost` | RabbitMQ连接地址 |
| `AMQP_TYPE` | `rabbitmq` | 消息队列类型 |

#### Redis 配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `REDIS_SERVER_HOST` | `localhost` | Redis主机 |
| `REDIS_SERVER_PORT` | `6379` | Redis端口 |
| `REDIS_SERVER_PASS` | - | Redis密码 |

### 1.5 HTTPS 配置

#### 自签名证书生成

```bash
# 生成私钥
openssl genrsa -out tls.key 2048

# 生成证书签名请求
openssl req -new -key tls.key -out tls.csr

# 签名证书
openssl x509 -req -days 365 -in tls.csr -signkey tls.key -out tls.crt

# 生成DH参数
openssl dhparam -out dhparam.pem 2048

# 安装证书
mkdir -p /app/onlyoffice/DocumentServer/data/certs
cp tls.key /app/onlyoffice/DocumentServer/data/certs/
cp tls.crt /app/onlyoffice/DocumentServer/data/certs/
cp dhparam.pem /app/onlyoffice/DocumentServer/data/certs/
chmod 400 /app/onlyoffice/DocumentServer/data/certs/tls.key
```

#### Let's Encrypt 证书

```bash
sudo docker run -i -t -d -p 80:80 -p 443:443 \
    -e LETS_ENCRYPT_DOMAIN=your_domain \
    -e LETS_ENCRYPT_MAIL=your_mail \
    onlyoffice/documentserver
```

---

## 二、DocSpace 项目中的 DocumentServer 配置

### 2.1 当前运行状态

| 项目 | 值 |
|------|-----|
| 容器名称 | `onlyoffice-document-server` |
| 状态 | `healthy` |
| 端口映射 | `0.0.0.0:8085->80/tcp` |
| 所在网络 | `onlyoffice` (bridge) |
| 内部IP | `172.18.0.6` |

### 2.2 当前环境变量配置

```
JWT_ENABLED=true
JWT_SECRET=DocSpace2024SecureJwtSecretKey123!  # ✅ 已修改为与DocSpace服务一致
JWT_HEADER=AuthorizationJwt
JWT_IN_BODY=true
PLUGINS_ENABLED=false                          # ✅ 已禁用插件

REDIS_SERVER_HOST=onlyoffice-redis
REDIS_SERVER_PORT=6379
REDIS_SERVER_DB=0
REDIS_SERVER_PASS=(空)

AMQP_URI=amqp://guest:guest@onlyoffice-rabbitmq:5672/
```

### 2.3 数据卷挂载情况

| 宿主机 volume | 容器内路径 | 用途 |
|--------------|-----------|------|
| `docker_app_data` | `/var/www/onlyoffice/Data` | 证书 |
| `docker_ds_fonts` | `/usr/share/fonts` | 字体 |
| (匿名volume) | `/var/lib/onlyoffice` | 缓存 |
| (匿名volume) | `/var/lib/postgresql` | 数据库 |
| (匿名volume) | `/var/lib/rabbitmq` | RabbitMQ |
| (匿名volume) | `/var/lib/redis` | Redis |
| `docker_log_data` | `/var/log/onlyoffice` | 日志 |

### 2.4 健康检查

```bash
curl http://localhost:8000/info/info.json
```

返回结果示例：
```json
{
  "serverInfo": {
    "buildVersion": "99.99.99",
    "buildNumber": 4514
  },
  "licenseInfo": {
    "hasLicense": false,
    "type": 3
  }
}
```

---

## 三、与其他容器的集成配置

### 3.1 DocSpace 服务连接 DocumentServer 的配置

各服务（dotnet、java、node）配置的环境变量：

| 环境变量 | 当前值 | 说明 |
|---------|--------|------|
| `DOCUMENT_SERVER_URL_PUBLIC` | `/ds-vpath/` | 公开访问路径 |
| `DOCUMENT_SERVER_URL_EXTERNAL` | `http://localhost:8085` | 外部访问地址 |
| `DOCUMENT_SERVER_JWT_SECRET` | `DocSpace2024SecureJwtSecretKey123!` | JWT密钥 |
| `DOCUMENT_SERVER_JWT_HEADER` | `AuthorizationJwt` | JWT头 |
| `DOCUMENT_CONTAINER_NAME` | `onlyoffice-document-server` | 容器名称 |

### 3.2 Router 代理配置

```nginx
# upstream.conf 中的相关配置
map "" "$document_server" {
    volatile;
    default "";
    "" "http://onlyoffice-document-server";
}

# onlyoffice.conf 中的代理配置
location /oauth2 {
    proxy_pass http://onlyoffice-document-server:80;
}

location /sso {
    rewrite sso/(.*) /$1  break;
    proxy_pass http://onlyoffice-node-services:9834;
}

location ~* /clients {
    proxy_pass http://onlyoffice-document-server:9090;
}
```

---

## 四、问题分析

### 4.1 JWT Secret 不匹配问题 ⚠️

**问题描述**：

| 容器 | JWT_SECRET 值 |
|------|--------------|
| `onlyoffice-document-server` | `your_jwt_secret` (默认值) |
| `onlyoffice-dotnet-services` | `DocSpace2024SecureJwtSecretKey123!` |
| `onlyoffice-java-services` | `DocSpace2024SecureJwtSecretKey123!` |
| `onlyoffice-node-services` | `DocSpace2024SecureJwtSecretKey123!` |

**影响**：

当后端服务（如 .NET、Java、Node 服务）尝试调用 DocumentServer API 时，会因为 JWT 密钥不一致导致验证失败，DocumentServer 会拒绝请求。

**建议**：

DocumentServer 的 `JWT_SECRET` 应该修改为与其他服务一致的 `DocSpace2024SecureJwtSecretKey123!`。

### 4.2 版本号异常

**观察**：健康检查返回的版本号为 `"buildVersion":"99.99.99"`，这看起来不是一个正常的版本号。

**可能原因**：
- 测试/开发版本
- 许可证问题
- 配置异常

### 4.3 JWT_IN_BODY 配置

**当前值**：`true`

**说明**：此配置表示 JWT 令牌可以在请求体中传递。如果其他服务使用此方式传递令牌，则应保持一致。

---

## 五、验证命令

### 5.1 查看 DocumentServer 容器状态

```bash
wsl docker ps | grep document-server
```

### 5.2 查看 DocumentServer 环境变量

```bash
wsl docker exec onlyoffice-document-server sh -c "env | grep -E 'JWT|DB_|REDIS_|AMQP_'"
```

### 5.3 检查健康状态

```bash
wsl docker exec onlyoffice-document-server curl -s http://localhost:8000/info/info.json
```

### 5.4 查看日志

```bash
wsl docker logs onlyoffice-document-server --tail 50
```

### 5.5 测试服务间连通性

```bash
# 从任意容器测试连接到 DocumentServer
wsl docker exec onlyoffice-dotnet-services curl -I http://onlyoffice-document-server:80/

# 测试 JWT 验证
wsl docker exec onlyoffice-document-server sh -c "curl -s -H 'AuthorizationJwt: test' http://localhost:8000/info/info.json"
```

### 5.6 检查网络连接

```bash
# 确认 DocumentServer 在 onlyoffice 网络中
wsl docker network inspect onlyoffice

# 查看 DocumentServer 的 IP
wsl docker inspect onlyoffice-document-server --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

---

## 六、完整 docker-compose 示例（独立部署）

```yaml
version: '3.8'

services:
  onlyoffice-documentserver:
    image: onlyoffice/documentserver
    container_name: onlyoffice-document-server
    depends_on:
      - onlyoffice-postgresql
      - onlyoffice-rabbitmq
    environment:
      - DB_TYPE=postgres
      - DB_HOST=onlyoffice-postgresql
      - DB_PORT=5432
      - DB_NAME=onlyoffice
      - DB_USER=onlyoffice
      - DB_PWD=onlyoffice_password
      - AMQP_URI=amqp://guest:guest@onlyoffice-rabbitmq:5672/
      - JWT_ENABLED=true
      - JWT_SECRET=your_secure_jwt_secret
      - JWT_HEADER=AuthorizationJwt
      - JWT_IN_BODY=true
    ports:
      - '80:80'
      - '443:443'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/info/info.json"]
      interval: 30s
      retries: 5
      start_period: 60s
      timeout: 10s
    restart: always
    volumes:
      - document_data:/var/www/onlyoffice/Data
      - document_logs:/var/log/onlyoffice
      - document_lib:/var/lib/onlyoffice
      - document_db:/var/lib/postgresql
      - document_rabbitmq:/var/lib/rabbitmq
      - document_redis:/var/lib/redis
      - document_fonts:/usr/share/fonts

  onlyoffice-rabbitmq:
    image: rabbitmq:3
    container_name: onlyoffice-rabbitmq
    restart: always
    expose:
      - '5672'
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "status"]
      interval: 10s
      retries: 3
      start_period: 10s
      timeout: 10s

  onlyoffice-postgresql:
    image: postgres:15
    container_name: onlyoffice-postgresql
    environment:
      - POSTGRES_DB=onlyoffice
      - POSTGRES_USER=onlyoffice
      - POSTGRES_PASSWORD=onlyoffice_password
      - POSTGRES_HOST_AUTH_METHOD=trust
    restart: always
    expose:
      - '5432'
    volumes:
      - postgresql_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U onlyoffice"]
      interval: 10s
      retries: 3
      start_period: 10s
      timeout: 10s

  onlyoffice-redis:
    image: redis:7
    container_name: onlyoffice-redis
    restart: always
    expose:
      - '6379'

volumes:
  document_data:
  document_logs:
  document_lib:
  document_db:
  document_rabbitmq:
  document_redis:
  document_fonts:
  postgresql_data:
```

---

## 七、与其他 ONLYOFFICE 容器集成时的关键点

### 7.1 必须保持一致的配置

1. **JWT_SECRET**：DocumentServer 和调用方必须使用相同的密钥
2. **JWT_HEADER**：必须一致（当前为 `AuthorizationJwt`）
3. **JWT_IN_BODY**：如启用，调用方也必须在请求体中传递令牌
4. **网络**：所有容器必须在同一 Docker 网络中

### 7.2 常见集成错误

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 401 Unauthorized | JWT密钥不匹配 | 统一 JWT_SECRET |
| 502 Bad Gateway | 网络不通 | 检查容器网络 |
| Connection refused | 端口映射错误 | 检查 -p 参数 |
| Certificate error | 自签名证书 | 配置 SSL 或添加信任 |

---

*文档生成时间：2026-04-08*
*基于 ONLYOFFICE DocumentServer 官方文档和 DocSpace 项目实际配置分析*
