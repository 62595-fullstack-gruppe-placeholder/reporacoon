"use server";

import { generateAccessToken, generateRefreshToken } from "@/lib/auth/accessToken";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/auth/cookies";
import { createUser } from "@/lib/repository/user/userRepository";
import {
  createUserDTOSchema,
  SignupFormSchema,
} from "@/lib/repository/user/userSchemas";
import { sendConfirmationEmail } from "@/lib/auth/email/emailConfirmationService";
import { toast } from "sonner";

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
  try {
    const user = await createUser(
      createUserDTOSchema.parse({
        email: input.email,
        password: input.password,
      }),
    );

    // debug logs for email sending
    console.log("Sending confirmation email to:", user.email);
    const confirmURL = await sendConfirmationEmail(user.id, user.email);
    console.log("Email sent successfully");

    await setAccessTokenCookie(await generateAccessToken(user));
    await setRefreshTokenCookie(await generateRefreshToken(user));
    return {
      success: true as const,
      msg: <>
          Confirmation email sent! 
          <a
            href={confirmURL.toString()}
            target="_blank"
            rel="noreferrer noopener"
            className="underline text-primary"
          >
            Open verification link
          </a>
        </>,
      
    error: undefined,
      };
}
  catch (error: any) {
  // Add any other relevant error cases here
  if (error.message?.includes("already exists")) {
    return { success: false as const, error: "That email is already taken." };
  }
  return { success: false as const, error: "An unexpected error occurred." };
}
}
