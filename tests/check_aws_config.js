const c = require('/app/onlyoffice/config/appsettings.json');
console.log('aws:', JSON.stringify(c.aws, null, 2));
console.log('config.aws:', c.aws);
console.log('config.aws.cloudWatch:', c.aws ? c.aws.cloudWatch : 'undefined');