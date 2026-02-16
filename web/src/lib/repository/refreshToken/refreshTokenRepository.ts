import "server-only";
import { queryOne } from "@lib/database/remoteDataSource";
import {
  CreateRefreshTokenDTO,
  createRefreshTokenDTOSchema,
  refreshTokenSchema,
  type RefreshToken,
} from "./refreshTokenSchemas";

/**
 * Get refresh token by id, returns validated {@link RefreshToken} or null.
 */
export async function getRefreshTokenById(
  id: string,
): Promise<RefreshToken | null> {
  const row = await queryOne<RefreshToken>(
    `
      SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
      FROM refresh_tokens
      WHERE id = $1
      `,
    [id],
  );

  if (!row) return null;

  return refreshTokenSchema.parse(row);
}

/**
 * Create a new refresh token from {@link CreateRefreshTokenDTO}, returning the created {@link RefreshToken}.
 */
export async function createRefreshToken(
  input: CreateRefreshTokenDTO,
): Promise<RefreshToken> {
  const data = createRefreshTokenDTOSchema.parse(input);

  const row = await queryOne<RefreshToken>(
    `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING
        id,
        user_id,
        token_hash,
        expires_at,
        revoked_at,
        created_at
      `,
    [data.user_id, data.token_hash, data.expires_at],
  );

  if (!row) {
    throw new Error("Failed to insert refresh token");
  }

  return refreshTokenSchema.parse(row);
}
