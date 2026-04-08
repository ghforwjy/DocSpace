const fs = require('fs');
const path = require('path');
const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

nconf.argv()
    .env()
    .file("config", path.join(__dirname, 'config', 'config.json'));

console.log('Step 1 - After loading config.json:');
console.log('  app.appsettings:', nconf.get('app:appsettings'));
console.log('  app.environment:', nconf.get('app:environment'));
console.log('  aws:', nconf.get('aws'));

var appsettings = nconf.get("app").appsettings;
if(!path.isAbsolute(appsettings)){
    appsettings = path.join(__dirname, appsettings);
}
console.log('  Resolved appsettings path:', appsettings);

var env = nconf.get("app").environment;
console.log('  environment:', env);

console.log('Step 2 - Loading appsettings files:');
nconf.file("appsettingsWithEnv", path.join(appsettings, 'appsettings.' + env + '.json'));
nconf.file("appsettings", path.join(appsettings, 'appsettings.json'));
nconf.file("appsettingsServices", path.join(appsettings, 'appsettings.services.json'));
nconf.file("redisWithEnv", path.join(appsettings, 'redis.' + env + '.json'));
nconf.file("redis", path.join(appsettings, 'redis.json'));

console.log('Step 3 - After loading appsettings:');
console.log('  aws:', nconf.get('aws'));
console.log('  aws.cloudWatch:', nconf.get('aws:cloudWatch'));