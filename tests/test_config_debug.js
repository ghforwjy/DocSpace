console.log("=== Full config debug ===");
console.log("");

process.env.INSTALLATION_TYPE = '';
process.env.PATH_TO_CONF = '/app/onlyoffice/config';

process.argv = ['node', 'server.js',
    '--app.port=9899',
    '--app.appsettings=/app/onlyoffice/config',
    '--app.environment='];

const config = require('/var/www/services/ASC.Socket.IO/config');

console.log("After require config:");
console.log("  config.get('app'):", config.get('app'));
console.log("  config.get('app:appsettings'):", config.get('app:appsettings'));
console.log("  config.get('Redis'):", config.get('Redis') ? 'exists' : 'null');