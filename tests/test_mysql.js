const mysql = require('mysql2');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'onlyoffice_user',
  password: process.env.DB_PASS || 'onlyoffice_pass',
  database: process.env.DB_NAME || 'docspace',
  port: parseInt(process.env.DB_PORT) || 3306
};

console.log('Connecting with config:', {
  host: config.host,
  user: config.user,
  database: config.database,
  port: config.port
});

const conn = mysql.createConnection(config);
conn.connect((err) => {
  if (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected successfully!');
  conn.end();
});