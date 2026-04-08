const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');
const path = require('path');

console.log("=== Simulating exact config/index.js flow ===");
console.log("");

// Step 1: nconf.argv() - Should read --app.appsettings from command line
console.log("1. Adding command line arg --app.appsettings=/app/onlyoffice/config");
process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=Production');

console.log("   process.argv:", process.argv.slice(2));

nconf.argv().env();

console.log("");
console.log("2. After nconf.argv().env():");
console.log("   nconf.get('app'):", nconf.get('app'));
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   nconf.get('app:environment'):", nconf.get('app:environment'));

console.log("");
console.log("3. Loading config.json (file overwrites argv!)");
nconf.file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'));

console.log("   After file load:");
console.log("   nconf.get('app'):", nconf.get('app'));
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   (config.json OVERWROTE argv!)");

console.log("");
console.log("=== CONCLUSION ===");
console.log("config.json has: appsettings='../../../../buildtools/config' (relative path)");
console.log("This relative path doesn't exist, so appsettings files can't be loaded!");
console.log("");
console.log("The bug: nconf.file() OVERWRITES nconf.argv() values!");
console.log("The fix: Command line parameters should OVERRIDE file values, not vice versa.");