const fs = require('fs');
const path = require('path');

const configPath = '/app/onlyoffice/config/appsettings.json';

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('Has aws key:', 'aws' in config);
console.log('aws value:', JSON.stringify(config.aws, null, 2));