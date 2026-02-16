import { query } from './client'; 

async function testDB() {
  try {
    const res = await query('SELECT NOW()');
    console.log('DB connected, current time:', res.rows[0]);
  } catch (err) {
    console.error('DB connection failed:', err);
  } finally {
    process.exit(0);
  }
}

testDB();

