import "server-only";
import { queryOne } from "@lib/database/remoteDataSource";
import {
  CreateEmailConfirmationDTO,
  createEmailConfirmationDTOSchema,
  emailConfirmationSchema,
  type EmailConfirmation,
} from "./emailConfirmationSchemas";

export async function createEmailConfirmation(
  input: CreateEmailConfirmationDTO
): Promise<EmailConfirmation> {
  const data = createEmailConfirmationDTOSchema.parse(input);

  const row = await queryOne<EmailConfirmation>(
    `
    INSERT INTO email_confirmations (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, token_hash, expires_at, confirmed_at, created_at
    `,
    [data.user_id, data.token_hash, data.expires_at]
  );

  if (!row) throw new Error("Failed to create email confirmation");

  return emailConfirmationSchema.parse(row);
}

export async function getEmailConfirmationByTokenHash(
  tokenHash: string
): Promise<EmailConfirmation | null> {
  const row = await queryOne<EmailConfirmation>(
    `
    SELECT id, user_id, token_hash, expires_at, confirmed_at, created_at
    FROM email_confirmations
    WHERE token_hash = $1
    `,
    [tokenHash]
  );

  if (!row) return null;

  return emailConfirmationSchema.parse(row);
}


export async function markEmailConfirmationUsed(id: string): Promise<void> {
  await queryOne(
    `UPDATE email_confirmations SET confirmed_at = NOW() WHERE id = $1`,
    [id]
  );
}