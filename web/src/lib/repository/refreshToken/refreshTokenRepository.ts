import "server-only";
import { queryOne } from "@lib/database/remoteDataSource";
import {
  CreateRefreshTokenDTO,
  createRefreshTokenDTOSchema,
  refreshTokenSchema,
  type RefreshToken,
} from "./refreshTokenSchemas";
import pg from "pg";

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
  client?: pg.PoolClient,
): Promise<RefreshToken> {
  const data = createRefreshTokenDTOSchema.parse(input);

  const row = await queryOne<RefreshToken>(
    `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, token_hash, expires_at, revoked_at, created_at
    `,
    [data.user_id, data.token_hash, data.expires_at],
    client,
  );

  if (!row) throw new Error("Failed to insert refresh token");
  return refreshTokenSchema.parse(row);
}

/**
 * Revokes all active refresh tokens for a specific user.
 * This is useful for "Log out from all devices" or security resets.
 */
export async function revokeUserRefreshTokens(
  userId: string,
  client?: pg.PoolClient,
): Promise<void> {
  await queryOne(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
    client,
  );
}


/**
 * Get refresh token by hash, returns validated {@link RefreshToken} or null.
 */
export async function getRefreshTokenByHash(
  hash: string,
): Promise<RefreshToken | null> {
  const row = await queryOne<RefreshToken>(
    `
      SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
      FROM refresh_tokens
      WHERE token_hash = $1
      `,
    [hash],
  );

  if (!row) return null;

  return refreshTokenSchema.parse(row);
}
