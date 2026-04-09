#!/usr/bin/env python3
import subprocess
import sys

cmd = [
    'docker', 'exec', 'onlyoffice-documentserver',
    'bash', '-c',
    'python3 -c "'
    'import mysql.connector; '
    'conn = mysql.connector.connect(host=\\\'onlyoffice-mysql-server\\\', user=\\\'onlyoffice_user\\\', password=\\\'onlyoffice_pass\\\', port=3306, database=\\\'docspace\\\'); '
    'print(\\\'Connected!\\\'); '
    'conn.close()'
    '"'
]

result = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", result.returncode)
print("Stdout:", result.stdout)
print("Stderr:", result.stderr)
sys.exit(result.returncode)