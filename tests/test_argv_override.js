const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("=== Testing command line argv ===");

// Add command line arguments like Supervisor would
process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=');

console.log("process.argv:", process.argv);

nconf.argv()
    .env()
    .file("config", "/var/www/services/ASC.Socket.IO/config/config.json");

console.log("");
console.log("After loading with argv:");
console.log("  nconf.get('app'):", nconf.get('app'));
console.log("  nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("  nconf.get('app:environment'):", nconf.get('app:environment'));

console.log("");
console.log("The issue: nconf argv does NOT override nested config values!");