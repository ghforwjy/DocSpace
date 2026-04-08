console.log("=== Testing nconf priority behavior ===");
console.log("");

const nconf = require('/var/www/services/ASC.Socket.IO/node_modules/nconf');

// Test
console.log("1. Add to argv:");
process.argv.push('--test.key=value1');
nconf.argv();
console.log("   nconf.get('test:key'):", nconf.get('test:key'));

console.log("");
console.log("2. Add another store with same key:");
nconf.file('test', { 'test': { 'key': 'value2' } });
console.log("   After file, nconf.get('test:key'):", nconf.get('test:key'));

console.log("");
console.log("3. Add argv again:");
process.argv.push('--test.key=value3');
nconf.argv();
console.log("   After second argv, nconf.get('test:key'):", nconf.get('test:key'));

console.log("");
console.log("4. Check argv override option:");
console.log("   nconf has 'override' option in argv():", typeof nconf.argv === 'function');

console.log("");
console.log("=== Checking nconf.argv documentation ===");
console.log("   nconf argv function:", nconf.argv.toString().substring(0, 200));