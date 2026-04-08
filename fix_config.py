import json

with open("/tmp/appsettings.json", "r") as f:
    d = json.load(f)

if "wrongPortalNameUrl" not in d.get("core", {}):
    print("Adding wrongPortalNameUrl to core...")
    d.setdefault("core", {})["wrongPortalNameUrl"] = "http://localhost"
    with open("/tmp/appsettings.json", "w") as f:
        json.dump(d, f, indent=2)
    print("Done")
else:
    print("Already exists:", d["core"]["wrongPortalNameUrl"])