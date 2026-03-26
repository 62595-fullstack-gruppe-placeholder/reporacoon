import { jwtVerify } from "jose";
import { loadKeys } from "./keys";
import { getAccessTokenCookie } from "./cookies";
import { type User } from "../repository/user/userSchemas";
import { claimsToUser } from "./jwt";
import { NextRequest } from "next/server";

/**
 * Get the currently
 * @returns
 */
export async function getUser(req?: NextRequest): Promise<User | null> {
  try {
    const accessTokenCookie = await getAccessTokenCookie(req);

    if (!accessTokenCookie?.value) {
      return null;
    }

    const { publicKey } = await loadKeys();
    const { payload } = await jwtVerify(accessTokenCookie.value, publicKey, {
      issuer: "reporacoon",
      audience: "reporacoon",
    });

    return claimsToUser(payload);
  } catch (error) {
    return null;
  }
}