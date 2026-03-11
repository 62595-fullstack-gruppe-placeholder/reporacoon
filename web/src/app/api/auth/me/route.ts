import { NextRequest, NextResponse } from "next/server";
import { loadKeys } from "@/lib/auth/keys";
import { jwtVerify } from "jose";
import { getUserById } from "@/lib/repository/user/userRepository";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get("access-token")?.value;
  if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { publicKey } = await loadKeys();
    const verified = await jwtVerify(accessToken, publicKey, {
      issuer: "reporacoon",
      audience: "reporacoon",
    });

    const userId = verified.payload.sub;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserById(userId);
    if (!user || !user.email_confirmed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}