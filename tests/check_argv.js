console.log("=== Check actual argv ===");
console.log("process.argv:", process.argv);
console.log("");
console.log("Looking for app.appsettings in argv:");
process.argv.forEach((arg, i) => {
    if (arg.includes('app.appsettings') || arg.includes('appsettings')) {
        console.log(`  argv[${i}]: ${arg}`);
    }
});