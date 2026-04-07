import subprocess
import json
import sys

result = subprocess.run(
    ['docker', 'exec', 'onlyoffice-router', 'cat', '/var/www/public/scripts/config.json'],
    capture_output=True,
    text=True
)

config = json.loads(result.stdout)
config['api']['origin'] = 'http://localhost:8081'

new_config = json.dumps(config, indent=2)

result = subprocess.run(
    ['docker', 'exec', 'onlyoffice-router', 'sh', '-c', f'echo \'{new_config}\' > /var/www/public/scripts/config.json'],
    capture_output=True,
    text=True
)

print("Updated config.json")

result = subprocess.run(
    ['docker', 'exec', 'onlyoffice-router', 'cat', '/var/www/public/scripts/config.json'],
    capture_output=True,
    text=True
)
print(result.stdout)
