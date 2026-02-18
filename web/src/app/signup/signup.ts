"use server";

import { generateAccessToken } from "@/lib/auth/accessToken";
import { setAccessTokenCookie } from "@/lib/auth/cookies";
import { createUser } from "@/lib/repository/user/userRepository";
import {
  createUserDTOSchema,
  SignupFormSchema,
} from "@/lib/repository/user/userSchemas";
import { redirect } from "next/navigation";

/**
 * Input to signup server action.
 */
export type SignupInput = Omit<SignupFormSchema, "confirmPassword">;

/**
 * Signup server action.
 * @param input see {@link SignupInput}.
 */
export async function signup(input: SignupInput) {
  const user = await createUser(
    createUserDTOSchema.parse({
      email: input.email,
      password: input.password,
    }),
  );

  await setAccessTokenCookie(await generateAccessToken(user));
  redirect("/dashboard");
}
