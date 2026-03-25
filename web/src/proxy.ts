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
    const forceRefresh = req.nextUrl.searchParams.get("force-token-refresh") === "true";
    const refreshToken = req.cookies.get("refresh-token")?.value;

    let currentUser = await getUser();
    
    let response = NextResponse.next();

    if (!currentUser || forceRefresh) {
      if (!refreshToken) {
        await deleteAccessTokenCookie();
        await deleteRefreshTokenCookie();
        return NextResponse.redirect(new URL("/login", req.url));
      }

      const { accessToken: newAccessToken, user } = await refreshAccessToken(refreshToken);
      const newRefreshToken = await generateRefreshToken(user);

      const requestHeaders = new Headers(req.headers);
      
      requestHeaders.set('cookie', `access-token=${newAccessToken}; refresh-token=${newRefreshToken}`);

      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      response.cookies.set("access-token", newAccessToken);
      response.cookies.set("refresh-token", newRefreshToken);

      currentUser = user;
    }

    if (!currentUser.email_confirmed) {
      log("User email not confirmed, redirecting to email confirmation page", LogLevel.debug);
      return NextResponse.redirect(new URL("/confirm-email/pending", req.url));
    }

    if (forceRefresh) {
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.searchParams.delete("force-token-refresh");
      return NextResponse.redirect(cleanUrl);
    }

    return response;
  }
  catch (error) {
    log(`Middleware error: ${error}`, LogLevel.error);
    return NextResponse.redirect(new URL("/error", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/subscription/:path*"]
};