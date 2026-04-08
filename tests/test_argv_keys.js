console.log("=== Checking nconf argv actual keys ===");
console.log("");

process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=Production');

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

nconf.argv();

console.log("1. nconf.stores.argv.store keys:");
console.log("   ", Object.keys(nconf.stores.argv.store || {}));

console.log("");
console.log("2. How nconf parses --app.appsettings:");
const argvStore = nconf.stores.argv.store;
console.log("   Has 'app.appsettings'?", 'app.appsettings' in argvStore);
console.log("   Has 'app:appsettings'?", 'app:appsettings' in argvStore);
console.log("   Has 'app'?", 'app' in argvStore);
console.log("");
console.log("   Value of 'app.appsettings':", argvStore['app.appsettings']);
console.log("   Value of 'app':", argvStore['app']);

console.log("");
console.log("3. nconf.get('app') vs nconf.get('app:appsettings'):");
console.log("   nconf.get('app'):", nconf.get('app'));
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   nconf.get('app.appsettings'):", nconf.get('app.appsettings'));