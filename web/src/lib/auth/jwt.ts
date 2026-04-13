import "server-only";
import { User } from "../repository/user/userSchemas";
import { UserClaims, userClaimsSchema } from "./authSchemas";
import { JWTPayload } from "jose";

/**
 * Map a user to a {@link UserClaims} object.
 * @param user user.
 * @returns claims.
 */
export function userToClaims(user: User): UserClaims {
  return {
    sub: user.id,
    ema: user.email,
    emc: user.email_confirmed,
    tier: user.tier,
    adm: user.is_admin,
  };
}

/**
 * Map claims to a user.
 * @param payload JWT payload.
 * @returns user or null if required claims are not present in JWT payload.
 */
export function claimsToUser(payload: JWTPayload): User | null {
  const verificationResult = userClaimsSchema.safeParse(payload);

  if (!verificationResult.success) {
    return null;
  }

  const userClaims = verificationResult.data;

  return {
    id: userClaims.sub,
    email: userClaims.ema,
    email_confirmed: userClaims.emc,
    tier: userClaims.tier,
    is_admin: userClaims.adm,
    settings: null,
  };
}
