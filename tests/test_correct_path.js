const fs = require('fs');
const path = require('path');
const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("=== Testing with CORRECT directory path ===");
console.log("");

// Simulate correct path (directory, not file)
process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=Production');

console.log("process.argv:", process.argv.slice(-3));

nconf.argv()
    .env()
    .file("config", "/var/www/services/ASC.Socket.IO/config/config.json");

console.log("");
console.log("After loading:");
const app = nconf.get('app');
console.log("  nconf.get('app'):", app);
console.log("  appsettings:", app ? app.appsettings : 'undefined');
console.log("  environment:", app ? app.environment : 'undefined');

if (app && app.appsettings) {
    const appsettingsPath = app.appsettings;
    const configFilePath = path.join(appsettingsPath, 'appsettings.json');
    console.log("");
    console.log("Config file path:", configFilePath);
    console.log("File exists:", fs.existsSync(configFilePath));

    if (fs.existsSync(configFilePath)) {
        const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        console.log("  aws in config file:", config.aws ? 'EXISTS' : 'MISSING');
        console.log("  config.get('aws'):", nconf.get('aws'));
    }
}

console.log("");
console.log("=== Key insight ===");
console.log("nconf stores keys with ':' as nested accessor, but stores with '.'");
console.log("So 'nconf.get(\"app:appsettings\")' uses colon, but actual key might be 'app.appsettings' from argv");