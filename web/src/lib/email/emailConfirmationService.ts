import "server-only";
import crypto from "crypto";
import { sendEmail } from "./mailer";
import {
  createEmailConfirmation,
  getEmailConfirmationByTokenHash,
  markEmailConfirmationUsed,
} from "@/lib/repository/emailConfirmations/emailConfirmationRepository";
import { markUserEmailConfirmed } from "@/lib/repository/user/userRepository";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function sendConfirmationEmail(
  userId: string,
  userEmail: string
): Promise<void> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  //set for 24 hours for now
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await createEmailConfirmation({ user_id: userId, token_hash: tokenHash, expires_at });

  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm-email?token=${rawToken}`;

  await sendEmail({
    to: userEmail,
    subject: "Confirm your email",
    html: `
      <h2>Welcome!</h2>
      <p>Click the link below to confirm your email address:</p>
      <a href="${confirmUrl}">${confirmUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}


// confirm email function not implemented yet
export async function confirmEmail(
  rawToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  const tokenHash = hashToken(rawToken);
  const confirmation = await getEmailConfirmationByTokenHash(tokenHash);

  if (!confirmation) return { success: false, error: "Invalid token" };
  if (confirmation.confirmed_at) return { success: false, error: "Token already used" };
  if (new Date(confirmation.expires_at) < new Date()) return { success: false, error: "Token expired" };

  await markEmailConfirmationUsed(confirmation.id);
  await markUserEmailConfirmed(confirmation.user_id);

  return { success: true };
}