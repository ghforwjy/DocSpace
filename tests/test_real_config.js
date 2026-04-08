console.log("=== Direct test in container ===");
console.log("");

// Add command line args like Supervisor would
process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=');

console.log("process.argv:", process.argv);

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');
const path = require('path');

// Call the actual config/index.js
require('/var/www/services/ASC.Socket.IO/config');

console.log("");
console.log("After require('/var/www/services/ASC.Socket.IO/config'):");
console.log("nconf.get('app'):", nconf.get('app'));
console.log("nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("nconf.get('aws'):", nconf.get('aws'));
console.log("");
console.log("The issue: config.json's relative path overrides the command line arg!");