import { z } from "zod";

/**
 * Base refresh token schema. Represents a row in the `refresh_tokens` table.
 */
export const refreshTokenSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  token_hash: z.string(),
  expires_at: z.iso.datetime({ offset: true }),
  revoked_at: z.iso.datetime({ offset: true }).nullable().optional(),
  created_at: z.iso.datetime({ offset: true }).nullable().optional(),
});

/**
 * Inferred type of {@link refreshTokenSchema}.
 */
export type RefreshToken = z.infer<typeof refreshTokenSchema>;

/**
 * DTO to create a refresh token.
 */
export const createRefreshTokenDTOSchema = z.object({
  user_id: z.string(),
  token_hash: z.string(),
  expires_at: z.iso.datetime({ offset: true }),
});

/**
 * Inferred type of {@link CreateRefreshTokenDTO}.
 */
export type CreateRefreshTokenDTO = z.infer<typeof createRefreshTokenDTOSchema>
