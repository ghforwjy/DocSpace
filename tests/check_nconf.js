const fs = require('fs');
const path = require('path');
const nconf = require('nconf');

const configPath = '/app/onlyoffice/config/appsettings.json';

nconf.argv()
    .env()
    .file("config", path.join(__dirname, 'config', 'config.json'));

nconf.file("appsettings", configPath);

const aws = nconf.get('aws');
console.log('nconf.get("aws"):', aws);

if (aws) {
    console.log('aws.cloudWatch:', aws.cloudWatch);
} else {
    console.log('aws is undefined or null');
}