const path = require('path');
const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("=== Testing nconf store priority ===");
console.log("");

// Add command line argument
process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=Production');

console.log("1. After argv():");
nconf.argv();
console.log("   app.appsettings:", nconf.get('app:appsettings'));

// Load file (this OVERWRITES argv!)
console.log("");
console.log("2. After loading file:");
nconf.file("config", "/var/www/services/ASC.Socket.IO/config/config.json");
console.log("   app.appsettings:", nconf.get('app:appsettings'));
console.log("   (File store OVERWROTE argv value!)");

// Solution: Load file FIRST, then argv
console.log("");
console.log("=== Solution: Load in correct order ===");
const nconf2 = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');
nconf2.file("config", "/var/www/services/ASC.Socket.IO/config/config.json");
console.log("1. After file():");
console.log("   app.appsettings:", nconf2.get('app:appsettings'));

nconf2.argv().env();
console.log("2. After argv().env():");
console.log("   app.appsettings:", nconf2.get('app:appsettings'));
console.log("   (Now command line OVERRIDES file!)");