#!/bin/bash
sudo pkill dockerd 2>/dev/null || true
sleep 2
sudo HTTP_PROXY=http://192.168.31.165:7897 HTTPS_PROXY=http://192.168.31.165:7897 dockerd > /tmp/dockerd.log 2>&1 &
sleep 5
docker info 2>/dev/null | grep -i -A 2 proxy