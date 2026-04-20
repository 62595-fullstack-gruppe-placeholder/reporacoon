import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import "server-only";

const ACCESS_TOKEN_NAME = "access-token";
const REFRESH_TOKEN_NAME = "refresh-token";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

// Helper to determine if we use the passed response or the global cookies()
async function getCookieStore(res?: NextResponse) {
  return res ? res.cookies : (await cookies());
}

export async function getAccessTokenCookie(req?: NextRequest) {
  if (req) {
    return req.cookies.get(ACCESS_TOKEN_NAME);
  }
  return (await cookies()).get(ACCESS_TOKEN_NAME);
}

export async function setAccessTokenCookie(token: string, res?: NextResponse) {
  const store = await getCookieStore(res);
  store.set(ACCESS_TOKEN_NAME, token, {
    ...getCookieOptions(),
    maxAge: 15 * 60,
  });
}

export async function setRefreshTokenCookie(token: string, res?: NextResponse) {
  const store = await getCookieStore(res);
  store.set(REFRESH_TOKEN_NAME, token, {
    ...getCookieOptions(),
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function deleteAuthCookies(res?: NextResponse) {
  const store = await getCookieStore(res);
  store.delete(ACCESS_TOKEN_NAME);
  store.delete(REFRESH_TOKEN_NAME);
}
