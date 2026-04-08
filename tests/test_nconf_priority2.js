console.log("=== Deep dive into nconf argv parsing ===");
console.log("");

// Test with process argv
process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=Production');

console.log("process.argv:", process.argv.slice(2));

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("");
console.log("1. After argv():");
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   nconf.get('app:environment'):", nconf.get('app:environment'));

console.log("");
console.log("2. After file():");
nconf.file('/var/www/services/ASC.Socket.IO/config/config.json');
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   nconf.get('app:environment'):", nconf.get('app:environment'));

console.log("");
console.log("3. After env():");
nconf.env();
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   nconf.get('app:environment'):", nconf.get('app:environment'));
console.log("   INSTALLATION_TYPE:", JSON.stringify(process.env.INSTALLATION_TYPE));

console.log("");
console.log("4. After argv() again:");
nconf.argv();
console.log("   nconf.get('app:appsettings'):", nconf.get('app:appsettings'));
console.log("   nconf.get('app:environment'):", nconf.get('app:environment'));