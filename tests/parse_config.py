import json

with open(r'e:\mycode\DocSpace\tests\local.json', 'r') as f:
    content = f.read()

data = json.loads(content)
print(json.dumps(data.get('services', {}).get('CoAuthoring', {}), indent=2))