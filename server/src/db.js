const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysql',
};

const dbName = process.env.DB_NAME || 'era_creatio';
let pool;

async function getPool() {
  if (pool) {
    return pool;
  }

  const bootstrapConnection = await mysql.createConnection(dbConfig);
  await bootstrapConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await bootstrapConnection.end();

  pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  });

  return pool;
}

module.exports = { getPool };
