import { User } from "../repository/user/userSchemas";
import { SignJWT } from "jose";
import { getFuture, getNow } from "../timeUtil";
import { loadKeys } from "./keys";

/**
 * Generate an access token JWT for a given user.
 * @param user the user for whom to generate the access token JWT.
 * @returns promise of access token JWT for the given user.
 */
export async function generateAccessToken(user: User): Promise<string> {
  const { privateKey } = await loadKeys();

  const jwt = new SignJWT({
    sub: user.id,
    email: user.email,
    iat: getNow(),
    exp: getFuture(60 * 60),
    iss: "reporacoon",
    aud: "reporacoon",
  }).setProtectedHeader({ alg: "RS256", kid: "reporacoon-001" });

  return await jwt.sign(privateKey);
}
