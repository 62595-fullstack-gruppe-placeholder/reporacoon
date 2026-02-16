import "server-only";
import { query, queryOne } from "@lib/database/remoteDataSource";
import {
  CreateUserDTO,
  createUserDTOSchema,
  User,
  userSchema,
} from "./userSchemas";

/**
 * Get user by id, returns validated {@link User} or null.
 */
export async function getUserById(id: string): Promise<User | null> {
  const row = await queryOne<User>(
    `
      SELECT id, email, email_confirmed
      FROM users
      WHERE id = $1
      `,
    [id],
  );

  if (!row) return null;

  return userSchema.parse(row);
}

/**
 * Create a new user from {@link CreateUserDTO}, returning the created {@link User}.
 */
export async function createUser(input: CreateUserDTO): Promise<User> {
  const data = createUserDTOSchema.parse(input);

  const row = await queryOne<User>(
    `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING
        id,
        email,
        email_confirmed
      `,
    [data.email, data.password_hash],
  );

  if (!row) {
    throw new Error("Failed to insert user");
  }

  return userSchema.parse(row);
}

/**
 * Get all users as validated array of {@link User}s.
 */
export async function getAllUsers(): Promise<User[]> {
  const rows = await query<User>(
    `
      SELECT id, email, email_confirmed
      FROM users
      ORDER BY id ASC
      `,
  );

  return rows.map((row) => userSchema.parse(row));
}
