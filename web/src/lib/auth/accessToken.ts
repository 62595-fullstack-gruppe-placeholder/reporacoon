import { User } from "../repository/user/userSchemas";
import { SignJWT, jwtVerify } from "jose";
import { getFuture, getNow } from "../timeUtil";
import { loadKeys } from "./keys";
import { getUserById } from "../repository/user/userRepository";
import crypto from "crypto";
import { createRefreshToken, getRefreshTokenByHash, getRefreshTokenById } from "../repository/refreshToken/refreshTokenRepository";


/**
 * Generate an access token JWT for a given user.
 * @param user the user for whom to generate the access token JWT.
 * @returns promise of access token JWT for the given user.
 */
export async function generateAccessToken(user: User): Promise<string> {
  const { privateKey } = await loadKeys();

  const jwt = new SignJWT({
    sub: user.id,
    ema: user.email,
    emc: user.email_confirmed,
    iat: getNow(),
    exp: getFuture(60 * 15),
    iss: "reporacoon",
    aud: "reporacoon",
  }).setProtectedHeader({ alg: "RS256", kid: "reporacoon-001" });

  return await jwt.sign(privateKey);
}

 
/**
 * Generate a refresh token for a given user.
 * @param user the user for whom to generate the refresh token.
 * @returns promise of refresh token for the given user.
 */
export async function generateRefreshToken(user: User): Promise<string> {
  const tokenString = crypto.randomBytes(32).toString("base64url"); 
  const tokenHash = crypto.createHash("sha256").update(tokenString).digest("hex");

  await createRefreshToken({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), 
  });

  return tokenString;
}


/**
 * Refreshes the access token JWT for a given refresh token JWT
 * @param refreshToken the refresh token JWT to generete the new access token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    
    const incomingHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const storedToken = await getRefreshTokenByHash(incomingHash)
    
    const userId = storedToken?.user_id
    
    if (!userId) {
      throw new Error("Token has no userId");
    }

    if (!storedToken || storedToken.revoked_at !== null) {
      throw new Error("Token revoked or missing");
    }

    if (storedToken.token_hash !== incomingHash) {
      throw new Error("Token mismatch");
    }

    const user = await getUserById(userId);
    
    if (!user) {
      throw new Error("User not found in database");
    }
    
    return {accessToken: await generateAccessToken(user), user};

  } catch (error) {
    console.error("Refresh failed:", error);
    throw new Error("Session expired. Please log in again.");
  }
}
