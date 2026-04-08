import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/repository/user/userRepository";
import { sendConfirmationEmail } from "@/lib/auth/email/emailConfirmationService";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ ok: true }); // silent — don't leak whether email exists

  if (user.email_confirmed) return NextResponse.json({ error: "Already confirmed" }, { status: 400 });

  const confirmURL = await sendConfirmationEmail(user.id, user.email);
  return NextResponse.json({ ok: true, confirmURL });
}