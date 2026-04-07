#!/usr/bin/env python3
"""
DocSpace 部署状态测试脚本
测试所有已发现的问题
"""

import subprocess
import json
import time

def run_cmd(cmd, timeout=30):
    """执行命令并返回输出"""
    try:
        # 直接在WSL中执行
        full_cmd = f'wsl -d Ubuntu-24.04 -u administrator -- bash -c "{cmd}"'
        result = subprocess.run(
            full_cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return "TIMEOUT"
    except Exception as e:
        return f"ERROR: {e}"

def check_document_server_health():
    """检查 Document Server 健康状态"""
    print("\n=== 检查 Document Server ===")
    result = run_cmd('docker exec onlyoffice-document-server curl -s http://localhost/healthcheck')
    print(f"Document Server Health: {result.strip()}")
    return "true" in result.lower()

def check_router_access():
    """检查 Router 访问"""
    print("\n=== 检查 Router 访问 ===")
    result = run_cmd('curl -s -o /dev/null -w "%{http_code}" http://localhost:8092/')
    print(f"Portal (8092) 状态码: {result.strip()}")
    result2 = run_cmd('curl -s -o /dev/null -w "%{http_code}" http://localhost:8085/')
    print(f"Document Server (8085) 状态码: {result2.strip()}")

def check_api_access():
    """检查 API 访问"""
    print("\n=== 检查 API 访问 ===")
    result = run_cmd('curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" http://localhost:8092/api/2.0/people.json')
    print(f"API /api/2.0/people.json 状态码: {result.strip()}")

    result = run_cmd('curl -s -o /dev/null -w "%{http_code}" http://onlyoffice-dotnet-services:5050/')
    print(f".NET API 直接访问状态码: {result.strip()}")

def check_config_json():
    """检查前端配置"""
    print("\n=== 检查前端 config.json ===")
    result = run_cmd('curl -s http://localhost:8092/static/scripts/config.json')
    try:
        config = json.loads(result)
        print(f"API Origin: '{config.get('api', {}).get('origin', 'NOT SET')}'")
        print(f"OAuth2 Origin: '{config.get('oauth2', {}).get('origin', 'NOT SET')}'")
        return config
    except:
        print(f"无法解析 config.json: {result[:200]}")
        return None

def check_document_server_url_config():
    """检查 Document Server URL 配置"""
    print("\n=== 检查 Document Server URL 配置 ===")
    result = run_cmd('docker exec onlyoffice-dotnet-services env | grep -i DOCUMENT_SERVER_URL_EXTERNAL')
    print(f".NET DOCUMENT_SERVER_URL_EXTERNAL: {result.strip()}")

    result = run_cmd('docker exec onlyoffice-node-services env | grep -i DOCUMENT_SERVER')
    print(f"Node.js DOCUMENT_SERVER 相关配置: {result.strip()[:200]}")

def check_rabbitmq_connections():
    """检查 RabbitMQ 连接"""
    print("\n=== 检查 RabbitMQ 连接 ===")
    result = run_cmd('docker exec onlyoffice-rabbitmq rabbitmqctl list_connections 2>&1 | grep -E "172.18.0" | wc -l')
    print(f"RabbitMQ 连接数量 (.NET + Java + DocServer): {result.strip()}")

def check_database():
    """检查数据库"""
    print("\n=== 检查数据库 ===")
    result = run_cmd("docker exec onlyoffice-mysql-server mysql -u root -pmy-secret-pw docspace -e 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=\"docspace\"' 2>&1 | tail -1")
    print(f"数据库表数量: {result.strip()}")

def check_node_services():
    """检查 Node.js 服务"""
    print("\n=== 检查 Node.js 服务 ===")
    result = run_cmd('docker exec onlyoffice-node-services supervisorctl status')
    print(result)

def check_dotnet_services():
    """检查 .NET 服务"""
    print("\n=== 检查 .NET 服务 ===")
    result = run_cmd('docker exec onlyoffice-dotnet-services supervisorctl status')
    print(result)

def check_docker_logs_errors():
    """检查 Docker 日志中的错误"""
    print("\n=== 检查最近日志错误 ===")

    containers = ['onlyoffice-node-services', 'onlyoffice-dotnet-services', 'onlyoffice-java-services']
    for container in containers:
        print(f"\n--- {container} 最近错误/警告 ---")
        result = run_cmd(f'docker logs --since 30m {container} 2>&1 | grep -i -E "error|fail|exception|timeout" | tail -5')
        if result.strip():
            print(result.strip())
        else:
            print("无错误/警告")

def check_env_config():
    """检查关键环境变量配置"""
    print("\n=== 检查关键环境变量 ===")
    result = run_cmd('cat /mnt/e/mycode/DocSpace/buildtools/install/docker/.env | grep -E "APP_CORE_MACHINEKEY|DOCUMENT_SERVER_JWT_SECRET|DOCUMENT_SERVER_URL_EXTERNAL|IDENTITY_ENCRYPTION_SECRET"')
    print(result)

def main():
    print("=" * 60)
    print("DocSpace 部署状态测试")
    print("=" * 60)

    check_document_server_health()
    check_router_access()
    check_config_json()
    check_api_access()
    check_document_server_url_config()
    check_rabbitmq_connections()
    check_database()
    check_node_services()
    check_dotnet_services()
    check_docker_logs_errors()
    check_env_config()

    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    main()