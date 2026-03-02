import { NextRequest, NextResponse } from "next/server";
import { confirmEmail } from "@/lib/auth/email/emailConfirmationService";
import { generateAccessToken } from "@/lib/auth/accessToken";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    // Check if request expects JSON or redirect
    if (req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ success: false, error: "Missing token" });
    }
    return NextResponse.redirect(new URL("/confirm-email/error?reason=missing-token", req.url));
  }

  const result = await confirmEmail(token);

  if (!result.success) {
    if (req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ success: false, error: result.error });
    }
    return NextResponse.redirect(
      new URL(`/confirm-email/error?reason=${encodeURIComponent(result.error)}`, req.url)
    );
  }

  // Generate access token and set cookie
  const accessToken = await generateAccessToken(result.user);
  const cookieStore = await cookies();
  cookieStore.set("access-token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  // If request expects JSON, return success
  if (req.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true });
  }

  // Otherwise redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard", req.url));
}