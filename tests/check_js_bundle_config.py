#!/usr/bin/env python
"""
检查 DocEditor 运行时 JS bundle 中 defaultConfig.api.origin 的值
"""
import requests
import re

def check_js_config():
    # 1. 检查静态 config.json
    r = requests.get('http://localhost:8092/static/scripts/config.json')
    static_config = r.json()
    print("=== 静态 config.json ===")
    print(f"api.origin: {static_config['api']['origin']!r}")

    # 2. 获取 doceditor 页面 HTML
    r2 = requests.get('http://localhost:8092/doceditor/')
    html = r2.text

    # 找到所有 JS 文件
    js_files = re.findall(r'src="([^"]+\.js)"', html)
    print(f"\n=== JS 文件列表 ({len(js_files)} 个) ===")

    # 3. 搜索所有 chunk 找 defaultConfig 或 api.origin
    print("\n=== 搜索 JS chunks 中的 api.origin ===")

    for js_path in js_files:
        url = f"http://localhost:8092{js_path}"
        try:
            r3 = requests.get(url, timeout=5)
            content = r3.text

            # 搜索 api.origin 模式
            match = re.search(r'"api":\s*\{[^}]*?"origin":\s*"([^"]*)"', content)
            if match:
                origin = match.group(1)
                print(f"\n[FOUND] {js_path}")
                print(f"  api.origin = {origin!r}")

                # 打印上下文
                start = max(0, match.start() - 100)
                end = min(len(content), match.end() + 100)
                print(f"  Context: ...{content[start:end]}...")
                print()
        except Exception as e:
            print(f"Error fetching {js_path}: {e}")

if __name__ == '__main__':
    check_js_config()