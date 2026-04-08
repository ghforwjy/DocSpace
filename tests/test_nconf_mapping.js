const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("=== Testing nconf argv parsing ===");
console.log("");

// Test 1: Without any arguments
console.log("1. Fresh nconf instance:");
console.log("   nconf.get('app'):", nconf.get('app'));

console.log("");
console.log("2. After nconf.argv().env():");
nconf.argv().env();
console.log("   nconf.get('app'):", nconf.get('app'));
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   nconf.get('PATH_TO_CONF'):", nconf.get('PATH_TO_CONF'));

console.log("");
console.log("3. Checking nconf stores:");
console.log("   stores:", Object.keys(nconf.stores));

console.log("");
console.log("4. The problem: nconf stores keys with ':' separator internally");
console.log("   But PATH_TO_CONF is stored as 'PATH_TO_CONF', not mapped to 'app.appsettings'");

console.log("");
console.log("5. To use PATH_TO_CONF as app.appsettings, we need:");
console.log("   nconf.set('app:appsettings', process.env.PATH_TO_CONF)");