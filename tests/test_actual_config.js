const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');
const path = require('path');

console.log("=== Testing actual config/index.js behavior ===");
console.log("");

// Check what argv contains
console.log("1. process.argv:");
process.argv.forEach((arg, i) => console.log(`   [${i}]: ${arg}`));

console.log("");
console.log("2. Calling nconf.argv().env()...");
nconf.argv().env();

console.log("   After nconf.argv().env():");
console.log("   nconf.get('app'):", nconf.get('app'));
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   nconf.get('PATH_TO_CONF'):", nconf.get('PATH_TO_CONF'));

console.log("");
console.log("3. Loading config.json...");
nconf.file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'));

console.log("   After nconf.file('config', ...):");
console.log("   nconf.get('app'):", nconf.get('app'));
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));

console.log("");
console.log("4. The problem: Supervisor passes '--app.appsettings=' but maybe it's empty or different?");
console.log("   PATH_TO_CONF env var:", process.env.PATH_TO_CONF);
console.log("   INSTALLATION_TYPE env var:", process.env.INSTALLATION_TYPE);