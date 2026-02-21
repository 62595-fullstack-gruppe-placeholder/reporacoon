import { z } from "zod";

export const emailConfirmationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  token_hash: z.string(),
  expires_at: z.coerce.date(),
  confirmed_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
});

export type EmailConfirmation = z.infer<typeof emailConfirmationSchema>;

export const createEmailConfirmationDTOSchema = z.object({
  user_id: z.string(),
  token_hash: z.string(),
  expires_at: z.string(),
});

export type CreateEmailConfirmationDTO = z.infer<typeof createEmailConfirmationDTOSchema>;