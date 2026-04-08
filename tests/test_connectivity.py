#!/usr/bin/env python3
import urllib.request
import urllib.error

urls = [
    ("主入口 8092", "http://localhost:8092/"),
    ("API 8081", "http://localhost:8081/"),
    ("Document Server 8085", "http://localhost:8085/"),
]

for name, url in urls:
    try:
        req = urllib.request.Request(url, method='GET')
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            content_type = response.headers.get('Content-Type', '')
            print(f"{name}: HTTP {status} - {content_type}")
    except urllib.error.HTTPError as e:
        print(f"{name}: HTTP {e.code} - {e.reason}")
    except urllib.error.URLError as e:
        print(f"{name}: 连接失败 - {e.reason}")
    except Exception as e:
        print(f"{name}: 错误 - {e}")
