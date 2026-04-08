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
    const rethrown = new Error(`Database query failed: ${fullMessage}`);
    (rethrown as any)._isUniqueConstraintViolation = true;
    throw rethrown;
  }
}

/**
 * For queries expected to return a single row.
 */
export async function queryOne<T = unknown>(
  text: string,
  params?: any[],
  client?: pg.PoolClient | pg.Pool, 
): Promise<T | null> {
  try {
    const executor = client || pool; 
    const result = await executor.query(text, params);
    return (result.rows[0] as T) ?? null;
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString?.() || JSON.stringify(error) || 'Unknown error';
    const errorDetails = error?.detail || error?.code || '';
    console.error("Database query error:", errorMessage);
    console.error("Error details:", errorDetails);
    console.error("Error code:", error?.code);
    console.error("Full error:", error);
    
    const fullMessage = errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage;
    const rethrown = new Error(`Database query failed: ${fullMessage}`);
    (rethrown as any)._isUniqueConstraintViolation = true;
    throw rethrown;
  }
  
}

/**
 * Executes a callback within a database transaction.
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
