console.log("=== Complete test of new config loading ===");
console.log("");

process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=Production');

console.log("process.argv:", process.argv.slice(2));

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');
const path = require('path');

console.log("");
console.log("Step 1: nconf.file('config', ...)");
nconf.file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'));
console.log("   nconf.get('app'):", nconf.get('app'));

console.log("");
console.log("Step 2: nconf.env()");
nconf.env();
console.log("   nconf.get('app'):", nconf.get('app'));

console.log("");
console.log("Step 3: nconf.argv()");
nconf.argv();
console.log("   nconf.get('app'):", nconf.get('app'));

console.log("");
console.log("Step 4: Calling getAndSaveAppsettings()");
var appsettings = nconf.get("app").appsettings;
console.log("   appsettings from nconf.get('app').appsettings:", appsettings);
console.log("   (Should be '/app/onlyoffice/config' but got wrong value!)");

console.log("");
console.log("=== The issue: file is overwriting argv! ===");
console.log("When file loads after argv, it completely replaces the 'app' object.");