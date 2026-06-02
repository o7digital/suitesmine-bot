import { Pool } from "pg";

const globalForDb = globalThis;

function createPool() {
  if (!process.env.DATABASE_URL) return null;

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });
}

export const pool = globalForDb.oliviaPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.oliviaPool = pool;
}

export function isDatabaseConfigured() {
  return Boolean(pool);
}

export async function query(text, params = []) {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured");
  }

  return pool.query(text, params);
}
