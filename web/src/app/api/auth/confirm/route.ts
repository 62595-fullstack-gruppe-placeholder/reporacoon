import { NextRequest, NextResponse } from "next/server";
import { confirmEmail } from "@/lib/auth/email/emailConfirmationService";
import { generateAccessToken } from "@/lib/auth/accessToken";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const isJson = req.headers.get("accept")?.includes("application/json");

  if (!token) {
    if (isJson) return NextResponse.json({ success: false, error: "Missing token" });
    return NextResponse.redirect(new URL("/confirm-email/error?reason=missing-token", appUrl));
  }

  const result = await confirmEmail(token);

  if (!result.success) {
    if (isJson) return NextResponse.json({ success: false, error: result.error });
    return NextResponse.redirect(
      new URL(`/confirm-email/error?reason=${encodeURIComponent(result.error)}`, appUrl)
    );
  }

  const accessToken = await generateAccessToken(result.user);

  if (isJson) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    return response;
  }

  const response = NextResponse.redirect(new URL("/dashboard", appUrl));
  response.cookies.set("access-token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return response;
}