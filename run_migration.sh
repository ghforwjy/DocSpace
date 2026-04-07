#!/usr/bin/expect -f
set timeout 300
spawn bash -c "cd /mnt/e/mycode/DocSpace/buildtools/install/docker && newgrp docker << 'ENDGRP'
docker compose -f migration-runner.yml run --rm onlyoffice-migration-runner
ENDGRP"
expect "password"
send "666888\r"
interact