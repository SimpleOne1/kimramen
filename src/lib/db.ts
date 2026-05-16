// src/lib/db.ts
import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
  acquireTimeout: Number(process.env.DB_ACQUIRE_TIMEOUT_MS || 10000),
  idleTimeout: Number(process.env.DB_IDLE_TIMEOUT_MS || 60000),
  charset: "utf8mb4",
});

export default pool;
