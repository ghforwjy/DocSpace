const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("=== Testing nconf env() behavior ===");
console.log("");

console.log("1. After nconf.env() - what does it create?");
nconf.env();
const envKeys = Object.keys(nconf.stores.env.store || {});
console.log("   env store keys containing 'PATH':", envKeys.filter(k => k.includes('PATH')));
console.log("   env store keys containing 'INSTALL':", envKeys.filter(k => k.includes('INSTALL')));

console.log("");
console.log("2. nconf.get('PATH_TO_CONF'):", nconf.get('PATH_TO_CONF'));
console.log("   nconf.get('INSTALLATION_TYPE'):", nconf.get('INSTALLATION_TYPE'));

console.log("");
console.log("3. The issue: nconf.env() reads env vars but doesn't KNOW they map to app.appsettings!");
console.log("   We need to use nconf.env().overrides() or manually set the mapping.");