const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("=== Testing nconf argv parsing ===");
console.log("");

// Simulate what config/index.js does
nconf.argv()
    .env()
    .file("config", "/var/www/services/ASC.Socket.IO/config/config.json");

console.log("After loading:");
console.log("  nconf.get('app'):", nconf.get('app'));
console.log("  nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("  nconf.get('app:environment'):", nconf.get('app:environment'));

console.log("");
console.log("=== Testing with explicit argv ===");
nconf.argv().overrides({
    'app': {
        'appsettings': '/app/onlyoffice/config',
        'environment': ''
    }
});
console.log("After overrides:");
console.log("  nconf.get('app'):", nconf.get('app'));
console.log("  nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("  nconf.get('app:environment'):", nconf.get('app:environment'));