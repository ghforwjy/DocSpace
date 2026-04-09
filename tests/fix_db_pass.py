import json

config_path = '/etc/onlyoffice/documentserver/local.json'
with open(config_path, 'r') as f:
    config = json.load(f)

if 'services' not in config:
    config['services'] = {}
if 'CoAuthoring' not in config['services']:
    config['services']['CoAuthoring'] = {}
if 'sql' not in config['services']['CoAuthoring']:
    config['services']['CoAuthoring']['sql'] = {}

config['services']['CoAuthoring']['sql']['dbPass'] = 'onlyoffice_pass'

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("Updated dbPass to onlyoffice_pass")