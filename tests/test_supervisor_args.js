console.log("=== Test with actual Supervisor-like args ===");
console.log("");

// Simulate supervisor passing these args
process.argv.push('--app.appsettings=/app/onlyoffice/config');
process.argv.push('--app.environment=');

console.log("process.argv:", process.argv.slice(2));

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');
const path = require('path');
const fs = require('fs');

nconf.file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'))
    .env()
    .argv();

console.log("");
console.log("After nconf setup:");
console.log("nconf.get('app'):", nconf.get('app'));

console.log("");
console.log("=== Simulating getAndSaveAppsettings ===");

var argvArgs = {};
process.argv.forEach(arg => {
    if(arg.startsWith('--app.appsettings=')){
        argvArgs.appsettings = arg.split('=')[1];
    }
    if(arg.startsWith('--app.environment=')){
        argvArgs.environment = arg.split('=')[1];
    }
});

console.log("argvArgs:", argvArgs);

var appsettings = argvArgs.appsettings !== undefined ? argvArgs.appsettings : null;
var env = argvArgs.environment !== undefined ? argvArgs.environment : null;

console.log("appsettings:", appsettings);
console.log("env:", JSON.stringify(env));

var configFilePath = path.join('/var/www/services/ASC.Socket.IO/config', 'config.json');
var configFromFile = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));

if(appsettings === null){
    appsettings = configFromFile.app.appsettings;
}
if(env === null){
    env = configFromFile.app.environment;
}

console.log("");
console.log("After fallback to config.json:");
console.log("appsettings:", appsettings);
console.log("env:", JSON.stringify(env));

if(!path.isAbsolute(appsettings)){
    appsettings = path.join('/var/www/services/ASC.Socket.IO', appsettings);
}

console.log("");
console.log("Final appsettings:", appsettings);
console.log("File exists:", fs.existsSync(appsettings));
console.log("appsettings.json exists:", fs.existsSync(path.join(appsettings, 'appsettings.json')));