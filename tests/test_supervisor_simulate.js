console.log("=== Simulate supervisor startup exactly ===");
console.log("");

// Simulate supervisor env - empty string
process.env.INSTALLATION_TYPE = '';
process.env.PATH_TO_CONF = '/app/onlyoffice/config';

// Simulate supervisor command line
process.argv = ['node', 'server.js',
    '--app.port=9899',
    '--app.appsettings=/app/onlyoffice/config',
    '--app.environment='];  // Empty string from supervisor

console.log("process.argv:", process.argv.slice(2));
console.log("env INSTALLATION_TYPE:", JSON.stringify(process.env.INSTALLATION_TYPE));

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
console.log("=== Now call getAndSaveAppsettings logic ===");

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

var appsettings = (argvArgs.appsettings !== undefined && argvArgs.appsettings !== '') ? argvArgs.appsettings : null;
var env = (argvArgs.environment !== undefined && argvArgs.environment !== '') ? argvArgs.environment : null;

console.log("appsettings before fallback:", appsettings);
console.log("env before fallback:", JSON.stringify(env));

var configFilePath = path.join('/var/www/services/ASC.Socket.IO/config', 'config.json');
var configFromFile = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));

if(appsettings === null){
    appsettings = configFromFile.app.appsettings;
    console.log("  -> appsettings fell back to config.json");
}
if(env === null){
    env = configFromFile.app.environment;
    console.log("  -> env fell back to config.json:", env);
}

console.log("");
console.log("Final appsettings:", appsettings);
console.log("Final env:", env);