#!/usr/bin/env python3
import subprocess
import sys

test_script = '''
import mysql.connector
import os

config = {
    'host': 'onlyoffice-mysql-server',
    'user': 'onlyoffice_user',
    'password': 'onlyoffice_pass',
    'port': 3306,
    'database': 'docspace'
}

print(f"Testing connection to {config['host']}:{config['port']}")
print(f"User: {config['user']}")
print(f"Database: {config['database']}")

try:
    conn = mysql.connector.connect(**config)
    print("SUCCESS: Connected to MySQL!")
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    print(f"Query result: {result}")
    cursor.close()
    conn.close()
except mysql.connector.Error as e:
    print(f"FAILED: {e}")
    sys.exit(1)
'''

with open('/tmp/test_mysql_conn.py', 'w') as f:
    f.write(test_script)

result = subprocess.run(
    ['docker', 'cp', '/tmp/test_mysql_conn.py', 'onlyoffice-documentserver:/tmp/test_mysql_conn.py'],
    capture_output=True, text=True
)
print("Copy script:", result.returncode)

result = subprocess.run(
    ['docker', 'exec', 'onlyoffice-documentserver', 'python3', '/tmp/test_mysql_conn.py'],
    capture_output=True, text=True
)
print("Output:", result.stdout)
print("Error:", result.stderr)