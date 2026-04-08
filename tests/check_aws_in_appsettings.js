const fs = require('fs');

const content = fs.readFileSync('/app/onlyoffice/config/appsettings.json', 'utf8');
const config = JSON.parse(content);

console.log("=== appsettings.json aws section ===");
console.log("Has 'aws' key:", 'aws' in config);
console.log("aws value:", JSON.stringify(config.aws, null, 2));