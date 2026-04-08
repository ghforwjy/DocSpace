const fs = require('fs');
const path = require('path');
const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("=== Simulating full config/index.js loading ===");
console.log("");

// Step 1: Same as config/index.js
nconf.argv()
    .env()
    .file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'));

console.log("Step 1 - After initial load:");
console.log("  app:", nconf.get('app'));
console.log("  app.appsettings:", nconf.get('app:appsettings'));

// Step 2: Call getAndSaveAppsettings() logic
var appsettings = nconf.get("app").appsettings;
var env = nconf.get("app").environment;

console.log("");
console.log("Step 2 - getAndSaveAppsettings():");
console.log("  appsettings:", appsettings);
console.log("  environment:", env);

if (appsettings) {
    // This is what getAndSaveAppsettings() does:
    nconf.file("appsettingsWithEnv", path.join(appsettings, 'appsettings.' + env + '.json'));
    nconf.file("appsettings", path.join(appsettings, 'appsettings.json'));
    nconf.file("appsettingsServices", path.join(appsettings, 'appsettings.services.json'));
    nconf.file("redisWithEnv", path.join(appsettings, 'redis.' + env + '.json'));
    nconf.file("redis", path.join(appsettings, 'redis.json'));

    console.log("");
    console.log("Step 3 - After loading appsettings files:");
    console.log("  nconf.get('aws'):", nconf.get('aws'));
    console.log("  nconf.get('aws:cloudWatch'):", nconf.get('aws:cloudWatch'));
}