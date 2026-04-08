console.log("=== Check Supervisor actual command ===");
console.log("");

const { execSync } = require('child_process');

// Get supervisor config for ASC.Socket.IO
try {
    const config = execSync('cat /etc/supervisor/conf.d/supervisord.conf', { encoding: 'utf8' });

    const socketSection = config.match(/\[program:ASC\.Socket\.IO\][\s\S]*?(?=\[program:|$)/);
    if (socketSection) {
        console.log("ASC.Socket.IO supervisor config:");
        console.log(socketSection[0]);
    }
} catch (e) {
    console.log("Error:", e.message);
}

console.log("");
console.log("=== Check actual environment ===");
console.log("process.env.PATH_TO_CONF:", process.env.PATH_TO_CONF);
console.log("process.env.INSTALLATION_TYPE:", JSON.stringify(process.env.INSTALLATION_TYPE));

console.log("");
console.log("=== Check actual argv (simulated) ===");
console.log("This script's argv:", process.argv);