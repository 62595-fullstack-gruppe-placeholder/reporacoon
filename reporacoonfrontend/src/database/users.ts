import { query } from './client';
import bcrypt from 'bcryptjs';


//uses bcryptjs to hash before storing the password 
export const createUser = async (username: string, password: string) => {
  const hashed = await bcrypt.hash(password, 10);
  return query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
    [username, hashed]
  );
};

export const findUserByUsername = async (username: string) => {
  const res = await query('SELECT * FROM users WHERE username = $1', [username]);
  return res.rows[0];
};
