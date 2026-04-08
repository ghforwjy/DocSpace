console.log("=== Test fixed getAndSaveAppsettings logic ===");
console.log("");

process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=Production');

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');
const path = require('path');
const fs = require('fs');

nconf.file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'))
    .env()
    .argv();

console.log("Current nconf.get('app'):", nconf.get('app'));
console.log("Current nconf.get('app:appsettings'):", nconf.get('app:appsettings'));

console.log("");
console.log("=== Simulating the fixed getAndSaveAppsettings ===");

var appFromArgv = nconf.get('app');
console.log("appFromArgv:", appFromArgv);
console.log("appFromArgv.appsettings:", appFromArgv ? appFromArgv.appsettings : 'undefined');

var appsettings = appFromArgv ? appFromArgv.appsettings : null;
var env = appFromArgv ? appFromArgv.environment : null;
console.log("appsettings (before check):", appsettings);
console.log("env (before check):", env);

if(!appsettings || !path.isAbsolute(appsettings)){
    console.log("  -> Using config.json values");
    var configFilePath = path.join('/var/www/services/ASC.Socket.IO/config', 'config.json');
    var configFromFile = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    console.log("  configFromFile.app:", configFromFile.app);
    if(!appsettings){
        appsettings = configFromFile.app.appsettings;
    }
    if(!env){
        env = configFromFile.app.environment;
    }
}

console.log("");
console.log("appsettings (after check):", appsettings);
console.log("env (after check):", env);