import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { loadKeys } from "./lib/auth/keys";
import { jwtVerify } from "jose";
import { getAccessTokenCookie } from "./lib/auth/cookies";
import { log, LogLevel } from "@/lib/log";

/**
 * Proxy running in front of protected pages. Handles access token verification.
 * @param req incoming request.
 * @returns response.
 */
export async function proxy(req: NextRequest) {
  const accessTokenCookie = await getAccessTokenCookie()

  if (!accessTokenCookie) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    return res;
  }

  try {
    const { publicKey } = await loadKeys();
    await jwtVerify(accessTokenCookie.value, publicKey, {
      issuer: "reporacoon",
      audience: "reporacoon",
    });

    return NextResponse.next();
  } catch {
    log("access token verification failed, redirecting to login", LogLevel.debug)
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("access-token");
    return res;
  }
}

/**
 * Specifies that the proxy runs in front of the /dashboard and /subscription paths.
 */
export const config = {
  matcher: ["/dashboard/:path*", "/subscription/:path*"],
};
