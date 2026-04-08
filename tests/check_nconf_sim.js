const fs = require('fs');
const path = require('path');

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

nconf.argv()
    .env()
    .file("config", path.join('/var/www/services/ASC.Socket.IO/config', 'config.json'));

console.log('After nconf.argv().env().file(config.json):');
console.log('  app:', nconf.get('app'));
console.log('  app.appsettings:', nconf.get('app:appsettings'));
console.log('  app.environment:', nconf.get('app:environment'));

const appsettings = nconf.get('app:appsettings') || nconf.get('app').appsettings;
const environment = nconf.get('app:environment') || nconf.get('app').environment;

console.log('');
console.log('Using appsettings:', appsettings);
console.log('Using environment:', JSON.stringify(environment));

if (appsettings) {
    const envPath = path.join(appsettings, 'appsettings.' + environment + '.json');
    console.log('Trying to load env-specific config:', envPath);
    console.log('File exists:', fs.existsSync(envPath));

    const basePath = path.join(appsettings, 'appsettings.json');
    console.log('Trying to load base config:', basePath);
    console.log('File exists:', fs.existsSync(basePath));
}

console.log('');
console.log('aws from nconf:', nconf.get('aws'));