const fs = require('fs');
const config = JSON.parse(fs.readFileSync('/etc/onlyoffice/documentserver/default.json', 'utf8'));
console.log(JSON.stringify(config.services.CoAuthoring.sql, null, 2));