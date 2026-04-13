import z from "zod";

/**
 * Schema for JWT user claims.
 */
export const userClaimsSchema = z.object({
  sub: z.string(),
  ema: z.email(),
  emc: z.boolean(),
  tier: z.enum(["free", "pro"]).default("free"),
  adm: z.boolean().default(false),
});

/**
 * Claims in access token JWTs that map to fields in the user model.
 */
export type UserClaims = z.infer<typeof userClaimsSchema>;
