import subprocess
import os
import tempfile

# Get config from container
result = subprocess.run(
    'wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-documentserver cat /etc/nginx/conf.d/ds-ssl.conf"',
    capture_output=True, text=True, shell=True
)
content = result.stdout

# Replace line 25
lines = content.split('\n')
lines[24] = '    rewrite ^ https://$host:8443$request_uri? permanent;'
new_content = '\n'.join(lines)

# Write to Windows temp file
temp_dir = tempfile.gettempdir()
temp_file = os.path.join(temp_dir, 'ds-ssl-fixed.conf')
with open(temp_file, 'w') as f:
    f.write(new_content)

# Convert to WSL path
wsl_temp_file = temp_file.replace('\\', '/').replace('C:', '/mnt/c')

# Use WSL to write content via docker exec stdin
write_cmd = f'wsl -d Ubuntu-24.04 -u administrator -- bash -c "cat {wsl_temp_file} | docker exec -i onlyoffice-documentserver tee /etc/nginx/conf.d/ds-ssl.conf"'
subprocess.run(write_cmd, shell=True)

# Reload nginx
subprocess.run(
    'wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-documentserver nginx -s reload"',
    shell=True
)

# Verify
result = subprocess.run(
    'wsl -d Ubuntu-24.04 -u administrator -- bash -c "docker exec onlyoffice-documentserver grep \\"rewrite.*8443\\" /etc/nginx/conf.d/ds-ssl.conf"',
    capture_output=True, text=True, shell=True
)
print("Verification:", result.stdout.strip() if result.stdout else "NOT FOUND")
print("Done!")
