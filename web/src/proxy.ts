import { NextResponse, NextRequest } from "next/server";
import { setAccessTokenCookie, setRefreshTokenCookie, deleteAuthCookies } from "./lib/auth/cookies";
import { log, LogLevel } from "@/lib/log";
import { getUser } from "./lib/auth/userFromToken";
import { generateRefreshToken, refreshAccessToken } from "./lib/auth/accessToken";

export async function proxy(req: NextRequest) {
  try {
    const forceRefresh = req.nextUrl.searchParams.get("force-token-refresh") === "true";
    const refreshToken = req.cookies.get("refresh-token")?.value;

    let currentUser = await getUser(req);

    if (!currentUser || forceRefresh) {
      if (!refreshToken) {
        const loginRes = NextResponse.redirect(new URL("/login", req.url));
        await deleteAuthCookies(loginRes);
        return loginRes;
      }

      const { accessToken, user } = await refreshAccessToken(refreshToken);
      const freshRefreshToken = await generateRefreshToken(user);

      let response: NextResponse;
      if (forceRefresh) {
        const cleanUrl = req.nextUrl.clone();
        cleanUrl.searchParams.delete("force-token-refresh");
        response = NextResponse.redirect(cleanUrl);
      } else {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('cookie', `access-token=${accessToken}; refresh-token=${freshRefreshToken}`);
        response = NextResponse.next({ request: { headers: requestHeaders } });
      }

      await setAccessTokenCookie(accessToken, response);
      await setRefreshTokenCookie(freshRefreshToken, response);
      
      currentUser = user;

      if (!currentUser.email_confirmed) {
        const confirmRes = NextResponse.redirect(new URL("/confirm-email/pending", req.url));
        await setAccessTokenCookie(accessToken, confirmRes);
        await setRefreshTokenCookie(freshRefreshToken, confirmRes);
        return confirmRes;
      }

      return response;
    }

    if (!currentUser.email_confirmed) {
      return NextResponse.redirect(new URL("/confirm-email/pending", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    log(`Middleware error: ${error}`, LogLevel.error);
    return NextResponse.redirect(new URL("/error", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/subscription/:path*"]
};