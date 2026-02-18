import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const auth = req.cookies.get("auth")?.value;
  const authenticated = auth === "true";

  if (!authenticated) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/subscription/:path*"],
};
