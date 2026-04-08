const fs = require('fs');
const path = require('path');

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

process.argv.push('--app.appsettings=/app/onlyoffice/config/appsettings.json');
process.argv.push('--app.environment=Development');

console.log('Simulated argv:', process.argv.slice(-3));

nconf.argv()
    .env()
    .file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'));

console.log('');
console.log('After loading with command line args:');
const appObj = nconf.get('app');
console.log('nconf.get("app"):', appObj);

const appsettings = appObj ? appObj.appsettings : null;
console.log('appsettings:', appsettings);
console.log('File exists:', appsettings ? fs.existsSync(appsettings) : false);

if (appsettings && fs.existsSync(appsettings)) {
    console.log('');
    console.log('Loading aws from:', path.join(appsettings, 'appsettings.json'));
    const awsConfig = JSON.parse(fs.readFileSync(path.join(appsettings, 'appsettings.json'), 'utf8'));
    console.log('aws in file:', JSON.stringify(awsConfig.aws, null, 2));
}

console.log('');
console.log('nconf.get("aws"):', nconf.get('aws'));