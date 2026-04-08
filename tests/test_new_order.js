console.log("=== Testing new config order ===");
console.log("");

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');
const path = require('path');

// Add command line args like Supervisor would
process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=');

console.log("process.argv:", process.argv.slice(2));

// New order: file first, then env, then argv
nconf.file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'))
    .env()
    .argv();

console.log("");
console.log("After new order:");
console.log("nconf.get('app'):", nconf.get('app'));
console.log("nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("nconf.get('app:environment'):", nconf.get('app:environment'));
console.log("nconf.get('PATH_TO_CONF'):", nconf.get('PATH_TO_CONF'));

console.log("");
console.log("=== The problem: env() is overwriting argv! ===");
console.log("When INSTALLATION_TYPE is empty string '', it overwrites the argv value.");