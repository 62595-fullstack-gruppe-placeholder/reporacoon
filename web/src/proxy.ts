import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { loadKeys } from "./lib/auth/keys";
import { jwtVerify } from "jose";
import { getAccessTokenCookie } from "./lib/auth/cookies";
import { log, LogLevel } from "@/lib/log";
import { getUserById } from "@/lib/repository/user/userRepository";

/**
 * Proxy running in front of protected pages. Handles access token verification.
 * @param req incoming request.
 * @returns response.
 */
export async function proxy(req: NextRequest) {
  // Get tokens from cookies
  const accessToken = req.cookies.get("access-token")?.value;
  const refreshToken = req.cookies.get("refresh-token")?.value;

  // Try verifying Access Token first
  if (accessToken) {
    try {
      const { publicKey } = await loadKeys();
      const verified = await jwtVerify(accessToken, publicKey, { 
        issuer: "reporacoon", 
        audience: "reporacoon" 
      });

      // Check if token contains user id
      const userId = verified.payload.sub;
      if (!userId) {
        throw new Error("Token does not contain user id");
      }

      // Check if user exists in database
      const user = await getUserById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Check if email is confirmed
      if (!user.email_confirmed) {
        log("User email not confirmed, redirecting to email confirmation page", LogLevel.debug);
        const res = NextResponse.redirect(new URL("/confirm-email/pending", req.url));
        res.cookies.delete("access-token");
        return res;
      }

      // Email IS confirmed - allow the request to proceed
      log("User email confirmed, allowing access", LogLevel.debug);
      return NextResponse.next();
    } catch (err) {
      log("Access token verification failed, attempting refresh...", LogLevel.debug);
      // Token is invalid/expired, try refresh below
    }
  }

  // Access token failed/missing, try Refresh Token
  if (refreshToken) {
    try {
      const refreshResponse = await fetch(new URL("/api/auth/refresh", req.url), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const { accessToken: newAccessToken } = await refreshResponse.json();
        const res = NextResponse.next();
        
        // Update the access token cookie for the browser
        res.cookies.set("access-token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60, // 1 hour
        });
        
        log("Token refreshed successfully", LogLevel.debug);
        return res;
      } else {
        log("Refresh token invalid", LogLevel.debug);
      }
    } catch (refreshErr) {
      log("Refresh failed", LogLevel.error);
    }
  }

  // No valid tokens, redirect to login
  log("No valid tokens, redirecting to login", LogLevel.debug);
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete("access-token");
  res.cookies.delete("refresh-token");
  return res;
}

/**
 * Specifies that the proxy runs in front of the /dashboard and /subscription paths.
 */
export const config = {
  matcher: ["/dashboard/:path*", "/subscription/:path*"],
};