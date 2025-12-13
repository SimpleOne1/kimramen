// src/services/database.ts
import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,    // оптимально для Next.js
  charset: "utf8mb4"
});

export default {
  getConnection() {
    return pool.getConnection();
  }
};