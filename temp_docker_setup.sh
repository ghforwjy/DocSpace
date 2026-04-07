#!/bin/bash
echo 666888 | sudo -S tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF
echo 666888 | sudo -S pkill dockerd 2>/dev/null || true
sleep 2
echo 666888 | sudo -S HTTP_PROXY=http://192.168.31.165:7897 HTTPS_PROXY=http://192.168.31.165:7897 nohup dockerd > /tmp/dockerd.log 2>&1 &
sleep 5
docker info 2>/dev/null | grep -i -A 2 proxy