import { jwtVerify } from "jose";
import { loadKeys } from "./keys";
import { getAccessTokenCookie } from "./cookies";
import { type User } from "../repository/user/userSchemas";
import { claimsToUser } from "./jwt";

/**
 * Get the currently 
 * @returns 
 */
export async function getUser(): Promise<User | null> {
  const accessTokenCookie = await getAccessTokenCookie();

  if (!accessTokenCookie) {
    return null;
  }

  const { publicKey } = await loadKeys();
  const { payload } = await jwtVerify(accessTokenCookie.value, publicKey, {
    issuer: "reporacoon",
    audience: "reporacoon",
  });

  return claimsToUser(payload);
}
