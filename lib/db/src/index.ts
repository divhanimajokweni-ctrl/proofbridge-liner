import { drizzle } from "drizzle-orm/node-postgres/driver";
import { Pool } from "pg";
import * as schema from "./schema";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Lazily initialize the database connection on first access.
 * This prevents build-time failures when Next.js collects page data
 * and DATABASE_URL is not available in the build environment.
 */
export function getDb() {
  if (_db) return _db;

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  _db = drizzle(_pool, { schema });
  return _db;
}

/**
 * Close the database pool (call during graceful shutdown).
 */
export async function closeDb(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}

export * from "./schema";
