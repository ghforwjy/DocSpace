import sys

# 读取原文件
with open('/etc/supervisor/conf.d/supervisord.conf', 'r') as f:
    content = f.read()

# 检查是否已有 environment
if 'API_HOST' in content:
    print("API_HOST already exists")
    sys.exit(0)

# 在 [supervisord] 段添加 environment
content = content.replace(
    '[supervisord]\nnodaemon=true\nlogfile=%(ENV_LOG_DIR)s/supervisord_node.log',
    '[supervisord]\nnodaemon=true\nlogfile=%(ENV_LOG_DIR)s/supervisord_node.log\nenvironment=API_HOST="http://onlyoffice-dotnet-services:5000"'
)

# 写回文件
with open('/etc/supervisor/conf.d/supervisord.conf', 'w') as f:
    f.write(content)

print("Fixed!")
