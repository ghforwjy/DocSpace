console.log("=== Full server.js startup simulation ===");
console.log("");

// Simulate supervisor env
process.env.INSTALLATION_TYPE = '';
process.env.PATH_TO_CONF = '/app/onlyoffice/config';

// Simulate supervisor command line
process.argv = ['node', 'server.js',
    '--app.port=9899',
    '--app.appsettings=/app/onlyoffice/config',
    '--app.environment='];

console.log("1. Starting require chain...");

// Load config first (like server.js does)
const config = require('/var/www/services/ASC.Socket.IO/config');
console.log("2. config module loaded");
console.log("   config.get('app'):", config.get('app'));
console.log("   config.get('Redis'):", config.get('Redis') ? 'exists' : 'null');

console.log("");
console.log("3. Trying to load express and other modules...");
const express = require('/var/www/services/ASC.Socket.IO/node_modules/express');
console.log("   express loaded");

console.log("");
console.log("4. Checking if we reach here...");
console.log("SUCCESS - all modules loaded");