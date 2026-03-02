import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { loadKeys } from "./lib/auth/keys";
import { jwtVerify } from "jose";
import { getAccessTokenCookie } from "./lib/auth/cookies";
import { log, LogLevel } from "@/lib/log";
import { getUserById } from "@/lib/repository/user/userRepository"; // import user for email confirm


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
    const verified = await jwtVerify(accessTokenCookie.value, publicKey, {
      issuer: "reporacoon",
      audience: "reporacoon",
    });



//check verified token contains user id in sub claim
  const userId = verified.payload.sub;

//if not, throw error
  if (!userId) {
    throw new Error("Token does not contain user id");
  }

//check if there is a user with the id in the token
  const user = await getUserById(userId);
  if (!user){
    throw new Error("User not found");
  }

  if (!user.email_confirmed) {
    log("user email not confirmed, redirecting to email confirmation page", LogLevel.debug)
    return NextResponse.redirect(new URL("/confirm-email/pending", req.url));
  }

    // Email IS confirmed - allow the request to proceed to the requested page
    log("user email confirmed, allowing access", LogLevel.debug);
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
