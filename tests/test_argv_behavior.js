console.log("=== Testing nconf argv override behavior ===");
console.log("");

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("1. Fresh nconf, call argv once:");
process.argv.push('--app.appsettings=/app/onlyoffice/config');
nconf.argv();
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));

console.log("");
console.log("2. Load file (simulating config.json):");
nconf.file('/var/www/services/ASC.Socket.IO/config/config.json');
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   (File loaded AFTER argv, overwriting the value!)");

console.log("");
console.log("3. Call argv() AGAIN:");
process.argv.push('--app.appsettings=/app/onlyoffice/config');
nconf.argv();
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   (argv called again but did NOT override file value!)");

console.log("");
console.log("=== CONCLUSION ===");
console.log("nconf.argv() does NOT override existing keys from previous stores!");
console.log("It only sets keys that DON'T EXIST in any store.");