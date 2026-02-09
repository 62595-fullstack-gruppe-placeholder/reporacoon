import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local file specifically
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

import pkg from 'pg';
const { Pool } = pkg;

// Debug log
console.log('Environment variables loaded:', {
  user: process.env.POSTGRES_USER || 'NOT FOUND',
  host: process.env.POSTGRES_HOST || 'NOT FOUND',
  database: process.env.POSTGRES_DB || 'NOT FOUND',
  password: process.env.POSTGRES_PASSWORD ? '***' : 'NOT FOUND',
  port: process.env.POSTGRES_PORT || 'NOT FOUND'
});

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT) || 5432,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;