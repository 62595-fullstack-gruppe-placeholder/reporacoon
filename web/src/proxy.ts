import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { deleteAccessTokenCookie, deleteRefreshTokenCookie, setAccessTokenCookie, setRefreshTokenCookie } from "./lib/auth/cookies";
import { log, LogLevel } from "@/lib/log";
import { getUser } from "./lib/auth/userFromToken";
import { generateRefreshToken, refreshAccessToken } from "./lib/auth/accessToken";

/**
 * Proxy running in front of protected pages. Handles access token verification.
 * @param req incoming request.
 * @returns response.
 */
export async function proxy(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh-token")?.value;
  
    let currentUser = await getUser()
    if (!currentUser) {
      if (!refreshToken) {
        await deleteAccessTokenCookie()
        await deleteRefreshTokenCookie()
        return NextResponse.redirect(new URL("/login", req.url));
      }
      const {accessToken: newAccessToken, user} = await refreshAccessToken(refreshToken);
      await setAccessTokenCookie(newAccessToken);
      await setRefreshTokenCookie(await generateRefreshToken(user));

      currentUser = user;
    }
  
    if (!currentUser.email_confirmed) {
      log("User email not confirmed, redirecting to email confirmation page", LogLevel.debug);
      return NextResponse.redirect(new URL("/confirm-email/pending", req.url));
    }

      return NextResponse.next();

  }
  catch {
    // TODO make error page
    return NextResponse.redirect(new URL("/error", req.url));
  }
}

/**
 * Specifies that the proxy runs in front of the /dashboard and /subscription paths.
 */
export const config = {
  matcher: ["/dashboard/:path*", "/subscription/:path*"],
};
