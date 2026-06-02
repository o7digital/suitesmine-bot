import { Pool } from "pg";

const globalForDb = globalThis;

function createPool() {
  const connectionString =
    process.env.RAILWAY_ENVIRONMENT_NAME
      ? process.env.DATABASE_URL
      : process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!connectionString) return null;

  return new Pool({
    connectionString,
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
