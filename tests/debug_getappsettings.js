console.log("=== Debug getAndSaveAppsettings execution ===");
console.log("");

// Simulate supervisor env
process.env.INSTALLATION_TYPE = '';
process.env.PATH_TO_CONF = '/app/onlyoffice/config';

// Simulate supervisor command line
process.argv = ['node', 'server.js',
    '--app.port=9899',
    '--app.appsettings=/app/onlyoffice/config',
    '--app.environment='];

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');
const path = require('path');
const fs = require('fs');

nconf.file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'))
    .env()
    .argv();

console.log("Step 1: nconf setup complete");

var argvArgs = {};
process.argv.forEach(arg => {
    if(arg.startsWith('--app.appsettings=')){
        argvArgs.appsettings = arg.split('=')[1];
    }
    if(arg.startsWith('--app.environment=')){
        argvArgs.environment = arg.split('=')[1];
    }
});

console.log("Step 2: argv parsed, argvArgs:", argvArgs);

var appsettings = (argvArgs.appsettings !== undefined && argvArgs.appsettings !== '') ? argvArgs.appsettings : null;
var env = (argvArgs.environment !== undefined && argvArgs.environment !== '') ? argvArgs.environment : null;

console.log("Step 3: after null check, appsettings=", appsettings, "env=", env);

var configFilePath = path.join('/var/www/services/ASC.Socket.IO/config', 'config.json');
var configFromFile = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));

if(appsettings === null){
    appsettings = configFromFile.app.appsettings;
    console.log("Step 4: appsettings fell back to config.json:", appsettings);
}
if(env === null){
    env = configFromFile.app.environment;
    console.log("Step 5: env fell back to config.json:", env);
}

console.log("");
console.log("FINAL RESULT: appsettings=" + appsettings + " env=" + env);
console.log("appsettings is absolute:", path.isAbsolute(appsettings));
console.log("appsettings file exists:", fs.existsSync(appsettings));
console.log("appsettings.json exists:", fs.existsSync(path.join(appsettings, 'appsettings.json')));