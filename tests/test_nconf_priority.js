console.log("=== Deep dive into nconf argv parsing ===");
console.log("");

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

// Test 1: Just argv
process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=Production');

const test1 = new (require('/var/www/services/ASC.Socket.IO/node_modules/nconf'))();
test1.argv();
console.log("1. Just argv:");
console.log("   test1.get('app'):", test1.get('app'));
console.log("   test1.get('app:appsettings'):", test1.get('app:appsettings'));

console.log("");
console.log("2. Add file after:");
const test2 = new (require('/var/www/services/ASC.Socket.IO/node_modules/nconf'))();
test2.argv();
test2.file('/var/www/services/ASC.Socket.IO/config/config.json');
console.log("   test2.get('app:appsettings'):", test2.get('app:appsettings'));

console.log("");
console.log("3. file, then env, then argv:");
const test3 = new (require('/var/www/services/ASC.Socket.IO/node_modules/nconf'))();
test3.file('/var/www/services/ASC.Socket.IO/config/config.json');
test3.env();
test3.argv();
console.log("   test3.get('app:appsettings'):", test3.get('app:appsettings'));
console.log("   test3.get('app:environment'):", test3.get('app:environment'));

console.log("");
console.log("4. Check stores priority:");
console.log("   argv store keys:", Object.keys(test3.stores.argv.store || {}));
console.log("   env store keys:", Object.keys(test3.stores.env.store || {}).filter(k => k.includes('app')));