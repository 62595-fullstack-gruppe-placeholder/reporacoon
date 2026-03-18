import { NextRequest, NextResponse } from "next/server";
import { confirmEmail } from "@/lib/auth/email/emailConfirmationService";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) {
    return NextResponse.redirect(new URL("/error?reason=missing-token", appUrl));
  }

  const result = await confirmEmail(token);

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/error?reason=${encodeURIComponent(result.error)}`, appUrl)
    );
  }

  const response = NextResponse.redirect(new URL("/dashboard?force-token-refresh=true", appUrl));
  return response;
}