import "server-only";
import { query, queryOne } from "@lib/database/remoteDataSource";
import {
  ChangePasswordDTO,
  CreateUserDTO,
  createUserDTOSchema,
  CredentialsDTO,
  Settings,
  settingsSchema,
  User,
  userSchema,
} from "./userSchemas";

/**
 * Get user by id, returns validated {@link User} or null.
 */
export async function getUserById(id: string): Promise<User | null> {
  const row = await queryOne<User>(
    `
      SELECT id, email, email_confirmed, tier, is_admin
      FROM users
      WHERE id = $1
      `,
    [id],
  );

  if (!row) return null;

  return userSchema.parse(row);
}

/**
 * Get user settings by id, returns validated {@link Settings} or null. Since we are using JSONB in the database, its a little funky 
 */
export async function getUserSettingsById(id: string): Promise<Settings | null> {
  const row = await queryOne<{
    user_settings: unknown; // Raw DB column
  }>(
    `SELECT user_settings FROM users WHERE id = $1`,
    [id],
  );

  if (!row || row.user_settings == null) return null;
  
  return settingsSchema.parse(row.user_settings); 
}

/**
 * updates the users settings. Includes both file extensions and scan type (deep/shallow)
 */
export async function setUserSettingsById(settings: Settings, userId: string): Promise<void> {
  await queryOne(`UPDATE users SET user_settings = $1 WHERE id = $2`, [
    settings, userId,
  ]);
}

/**
 * Create a new user from {@link CreateUserDTO}, returning the created {@link User}.
 */
export async function createUser(input: CreateUserDTO): Promise<User> {
  const data = createUserDTOSchema.parse(input);

  try {
    const row = await queryOne<User>(
      `
      INSERT INTO users (email, password_hash)
      VALUES ($1, crypt($2, gen_salt('bf')))
      RETURNING
        id,
        email,
        email_confirmed,
        tier,
        is_admin
      `,
      [data.email, data.password],
    );

    if (!row) {
      throw new Error("Failed to insert user");
    }

    return userSchema.parse(row);
  } catch (error: any) {
    // Check for PostgreSQL Unique Violation error code
    if (error.code === "23505") {
      throw new Error("A user with this email already exists.");
    }

    // Re-throw other unexpected errors
    throw error;
  }
}

/**
 * Get all users as validated array of {@link User}s.
 */
export async function getAllUsers(): Promise<User[]> {
  const rows = await query<User>(
    `
      SELECT id, email, email_confirmed, tier, is_admin
      FROM users
      ORDER BY id ASC
      `,
  );

  return rows.map((row) => userSchema.parse(row));
}

/**
 * Verify a user's login credentials, returning the user id if they are valid.
 * @param loginDTO see {@link LoginDTOSchema.}
 * @returns user's id if credentials are valid, otherwise null.
 */
export async function verifyUserCredentials(
  loginDTO: CredentialsDTO,
): Promise<User | null> {
  const row = await queryOne<User>(
    `SELECT id, email, email_confirmed, tier, is_admin FROM users
     WHERE email = $1
     AND password_hash = crypt($2, password_hash)`,
    [loginDTO.email, loginDTO.password],
  );

  const parseResult = userSchema.safeParse(row);

  return parseResult.success ? parseResult.data : null;
}

/**
 * marks mail as confirmed. note: this does not check if the user exists, so it will succeed even if the user id is invalid.
 */
export async function markUserEmailConfirmed(userId: string): Promise<void> {
  await queryOne(`UPDATE users SET email_confirmed = true WHERE id = $1`, [
    userId,
  ]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>("SELECT * FROM users WHERE email = $1", [email]);
}

/**
 * Change a user's password. Requires the current password and fails if it doesn't match.
 * @param dto a {@link ChangePasswordDTO}.
 */
export async function changeUserPassword(
  dto: ChangePasswordDTO,
): Promise<void> {
  await queryOne(
    `UPDATE users SET password_hash = crypt($3, gen_salt('bf'))
     WHERE id = $1
     AND password_hash = crypt($2, password_hash)`,
    [dto.userId, dto.currentPassword, dto.newPassword],
  );
}

/**
 * Delete a user, setting the owner of their scan jobs to null.
 * @param userId id of the user to delete.
 */
export async function deleteUser(userId: string) {
  await queryOne(`DELETE FROM users WHERE id = $1`, [userId]);
}

export async function setUserTier(userId: string, tier: "free" | "pro"): Promise<boolean> {
  const row = await queryOne(
    `UPDATE users SET tier = $1 WHERE id = $2 RETURNING id`,
    [tier, userId],
  );
  return row !== null;
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<boolean> {
  const row = await queryOne(
    `UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id`,
    [isAdmin, userId],
  );
  return row !== null;
}
