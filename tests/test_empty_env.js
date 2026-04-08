const fs = require('fs');
const path = require('path');
const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

console.log("=== Testing with empty environment ===");
console.log("");

// Set environment to empty string (like INSTALLATION_TYPE="")
process.env.INSTALLATION_TYPE = '';

console.log("1. Environment:");
console.log("   INSTALLATION_TYPE:", JSON.stringify(process.env.INSTALLATION_TYPE));

// Simulate config/index.js
nconf.argv().env();

console.log("");
console.log("2. After nconf.argv().env():");
console.log("   nconf.get('app'):", nconf.get('app'));

const appsettings = nconf.get("app").appsettings;
const env = nconf.get("app").environment;

console.log("");
console.log("3. getAndSaveAppsettings values:");
console.log("   appsettings:", appsettings);
console.log("   env:", JSON.stringify(env));

// Resolve path like the code does
if (appsettings) {
    if (!path.isAbsolute(appsettings)) {
        appsettings = path.join('/var/www/services/ASC.Socket.IO', appsettings);
    }
    console.log("   resolved appsettings:", appsettings);
}

console.log("");
console.log("4. Checking if files exist:");

const filesToCheck = [
    path.join(appsettings, 'appsettings.' + env + '.json'),
    path.join(appsettings, 'appsettings.json'),
    path.join(appsettings, 'appsettings.services.json'),
    path.join(appsettings, 'redis.' + env + '.json'),
    path.join(appsettings, 'redis.json'),
];

filesToCheck.forEach(f => {
    console.log(`   ${path.basename(f)}: exists=${fs.existsSync(f)}`);
});

console.log("");
console.log("5. Loading files in nconf...");
nconf.file("appsettingsWithEnv", path.join(appsettings, 'appsettings.' + env + '.json'));
nconf.file("appsettings", path.join(appsettings, 'appsettings.json'));
nconf.file("appsettingsServices", path.join(appsettings, 'appsettings.services.json'));
nconf.file("redisWithEnv", path.join(appsettings, 'redis.' + env + '.json'));
nconf.file("redis", path.join(appsettings, 'redis.json'));

console.log("");
console.log("6. Result:");
console.log("   nconf.get('aws'):", nconf.get('aws'));
console.log("   nconf.get('Redis'):", nconf.get('Redis'));