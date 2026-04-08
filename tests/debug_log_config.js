const path = require("path");
const config = require("/var/www/services/ASC.Socket.IO/config");

console.log("=== Debug log.js config loading ===");
console.log("");
console.log("Step 1: Check config object");
console.log("config.get('app'):", config.get('app'));
console.log("config.get('app:appsettings'):", config.get('app:appsettings'));
console.log("");
console.log("Step 2: Check aws from config");
console.log("config.get('aws'):", config.get('aws'));
console.log("config.get('aws:cloudWatch'):", config.get('aws:cloudWatch'));
console.log("");
console.log("Step 3: Check files loaded by nconf");
console.log("config.stores:", Object.keys(config.stores || {}));
console.log("");
console.log("Step 4: Get appsettings path and check file");
const appsettings = config.get('app:appsettings') || (config.get('app') || {}).appsettings;
console.log("Resolved appsettings path:", appsettings);
if (appsettings) {
    const fs = require('fs');
    console.log("Is absolute:", path.isAbsolute(appsettings));
    console.log("File exists:", fs.existsSync(appsettings));
    if (fs.existsSync(appsettings)) {
        console.log("It's a FILE, not a DIRECTORY!");
        console.log("Trying to load as directory will fail.");
    }
}