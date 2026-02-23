import "server-only";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("Unexpected DB pool error:", err.stack);
});

/**
 * Wraps pool.query, returns rows typed as T.
 * Use in repositories for all DB reads/writes.
 */
export async function query<T = unknown>(
  text: string,
  params?: any[],
): Promise<T[]> {
  try {
    const result = await pool.query(text, params);
    return result.rows as T[];
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString?.() || JSON.stringify(error) || 'Unknown error';
    const errorDetails = error?.detail || error?.code || '';
    console.error("Database query error:", errorMessage);
    console.error("Error details:", errorDetails);
    console.error("Error code:", error?.code);
    console.error("Full error:", error);
    
    const fullMessage = errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage;
    throw new Error(`Database query failed: ${fullMessage}`);
  }
}

/**
 * For queries expected to return a single row.
 */
export async function queryOne<T = unknown>(
  text: string,
  params?: any[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
