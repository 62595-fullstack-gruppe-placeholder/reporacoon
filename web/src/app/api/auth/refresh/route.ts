import { NextRequest, NextResponse } from "next/server";
import { generateAccessToken, generateRefreshToken, refreshAccessToken } from "@/lib/auth/accessToken";
import { log, LogLevel } from "@/lib/log";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh-token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token provided" }, 
      { status: 401 }
    );
  }

  try {
    const {accessToken: newAccessToken, user} = await refreshAccessToken(refreshToken);

    await setAccessTokenCookie(newAccessToken);
    await setRefreshTokenCookie(await generateRefreshToken(user));

    return NextResponse.json({ newAccessToken }, { status: 200 });

  } catch (error) {
    log(`Token refresh failed: ${error}`, LogLevel.error);
    
    return NextResponse.json(
      { error: "Invalid or expired session" }, 
      { status: 403 }
    );
  }
}