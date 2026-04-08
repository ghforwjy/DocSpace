const fs = require('fs');
const path = require('path');

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

nconf.argv()
    .env()
    .file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'));

console.log('After loading (simulating actual startup):');
const appObj = nconf.get('app');
console.log('nconf.get("app"):', appObj);
console.log('app.appsettings:', appObj ? appObj.appsettings : 'undefined');
console.log('app.environment:', appObj ? appObj.environment : 'undefined');

const appsettings = appObj ? appObj.appsettings : null;
const env = appObj ? appObj.environment : 'Development';

console.log('');
console.log('Trying path:', appsettings);
console.log('File exists:', appsettings ? fs.existsSync(appsettings) : false);

const resolvedAppsettings = appsettings ?
    (path.isAbsolute(appsettings) ? appsettings : path.join('/var/www/services/ASC.Socket.IO', appsettings)) : null;

console.log('Resolved path:', resolvedAppsettings);
console.log('Resolved exists:', resolvedAppsettings ? fs.existsSync(resolvedAppsettings) : false);

if (resolvedAppsettings && fs.existsSync(resolvedAppsettings)) {
    console.log('');
    console.log('Would load aws from:', path.join(resolvedAppsettings, 'appsettings.json'));
    const awsConfig = JSON.parse(fs.readFileSync(path.join(resolvedAppsettings, 'appsettings.json'), 'utf8'));
    console.log('aws in file:', awsConfig.aws);
} else {
    console.log('');
    console.log('Cannot load from that path, aws will be undefined!');
}

console.log('');
console.log('nconf.get("aws"):', nconf.get('aws'));