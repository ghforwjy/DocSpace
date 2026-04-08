console.log("=== Debug supervisor args ===");
process.argv.forEach((arg, i) => {
    if (arg.startsWith('--app.')) {
        console.log(`argv[${i}]: ${arg}`);
    }
});

// Check env variable
console.log("");
console.log("INSTALLATION_TYPE env:", JSON.stringify(process.env.INSTALLATION_TYPE));
console.log("PATH_TO_CONF env:", process.env.PATH_TO_CONF);