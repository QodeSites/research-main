import { Pool } from "pg";

// Create a connection pool
const pool = new Pool({
  user: process.env.PG_USER, // PostgreSQL username
  host: process.env.PG_HOST, // Hostname (e.g., localhost or remote)
  database: process.env.PG_DATABASE, // Database name
  password: process.env.PG_PASSWORD, // Password
  port: process.env.PG_PORT, // Port (default: 5432)
});

export const query = async (text, params) => {
  const res = await pool.query(text, params);
  const duration = Date.now();
  console.log("executed query", { text, duration, rows: res.rowCount });
  return res;
};

export default pool;
