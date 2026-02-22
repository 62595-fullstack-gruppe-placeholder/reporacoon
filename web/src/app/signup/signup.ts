"use server";

import { generateAccessToken } from "@/lib/auth/accessToken";
import { setAccessTokenCookie } from "@/lib/auth/cookies";
import { createUser } from "@/lib/repository/user/userRepository";
import {
  createUserDTOSchema,
  SignupFormSchema,
} from "@/lib/repository/user/userSchemas";
import { sendConfirmationEmail } from "@/lib/email/emailConfirmationService";
import { redirect } from "next/navigation";

/**
 * Input to signup server action.
 */
export type SignupInput = Omit<SignupFormSchema, "confirmPassword">;

/**
 * Signup server action. Creates a new user
 *
 * and sends a confirmation email.
 * @param input see {@link SignupInput}.
 */
export async function signup(input: SignupInput) {
  const user = await createUser(
    createUserDTOSchema.parse({
      email: input.email,
      password: input.password,
    }),
  );

  // debug logs for email sending
  try {
    console.log("Sending confirmation email to:", user.email);
    await sendConfirmationEmail(user.id, user.email);
    console.log("Email sent successfully");
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }

  await setAccessTokenCookie(await generateAccessToken(user));
  redirect("/dashboard");
}
