import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/auth/accessToken";
import { log, LogLevel } from "@/lib/log";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh-token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token provided" }, 
      { status: 401 }
    );
  }

  try {
    const newAccessToken = await refreshAccessToken(refreshToken);

    return NextResponse.json({ newAccessToken }, { status: 200 });

  } catch (error) {
    log(`Token refresh failed: ${error}`, LogLevel.error);
    
    return NextResponse.json(
      { error: "Invalid or expired session" }, 
      { status: 403 }
    );
  }
}