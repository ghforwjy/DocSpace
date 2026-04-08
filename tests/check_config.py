#!/usr/bin/env python3
import json
import sys

try:
    with open('/app/onlyoffice/config/appsettings.json', 'r') as f:
        config = json.load(f)

    print("Has 'aws' key:", 'aws' in config)
    aws = config.get('aws', {})
    print("aws value:", json.dumps(aws, indent=2))

    if aws:
        print("Has 'cloudWatch' key:", 'cloudWatch' in aws)
        cw = aws.get('cloudWatch', {})
        print("cloudWatch value:", json.dumps(cw, indent=2))
    else:
        print("aws is empty or None")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)