import "server-only";
import crypto from "crypto";
import { sendEmail } from "./mailer";
import {
  createEmailConfirmation,
  getEmailConfirmationByTokenHash,
  markEmailConfirmationUsed,
} from "@/lib/repository/emailConfirmations/emailConfirmationRepository";
import { getUserById, markUserEmailConfirmed } from "@/lib/repository/user/userRepository";
import { User } from "@/lib/repository/user/userSchemas";
import { toast } from "sonner";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

let lastEtherealURL: string | false = false;

export function getLastEtherealURL() {
  return lastEtherealURL;
}

export async function sendConfirmationEmail(
  userId: string,
  userEmail: string
): Promise<String> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  //set for 24 hours for now
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await createEmailConfirmation({ user_id: userId, token_hash: tokenHash, expires_at });

 const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/confirm?token=${rawToken}`;

  const etherealURL = await sendEmail({ 
    to: userEmail,
    subject: "Confirm your email",
    html: `
      <h2>Welcome!</h2>
      <p>Click the link below to confirm your email address:</p>
      <a href="${confirmUrl}">${confirmUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
  lastEtherealURL = etherealURL;
  return confirmUrl;
}


export async function confirmEmail(
  rawToken: string
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  const tokenHash = hashToken(rawToken);
  const confirmation = await getEmailConfirmationByTokenHash(tokenHash);

  if (!confirmation) return { success: false, error: "Invalid token" };
  if (confirmation.confirmed_at) return { success: false, error: "Token already used" };
  if (new Date(confirmation.expires_at) < new Date()) return { success: false, error: "Token expired" };

  await markEmailConfirmationUsed(confirmation.id);
  await markUserEmailConfirmed(confirmation.user_id);

  const user = await getUserById(confirmation.user_id);
  if (!user) return { success: false, error: "User not found" };

  return { success: true, user };
}