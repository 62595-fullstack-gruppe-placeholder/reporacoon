"use server";

import { generateAccessToken } from "@/lib/auth/accessToken";
import { setAccessTokenCookie } from "@/lib/auth/cookies";
import { verifyUserCredentials } from "@/lib/repository/user/userRepository";
import {
  type CredentialsDTO,
  credentialsDTOSchema,
} from "@/lib/repository/user/userSchemas";
import { redirect } from "next/navigation";

/**
 * Handle login requests.
 * @param input a {@link CredentialsDTO}.
 */
export async function login(input: CredentialsDTO) {
  const parsed = credentialsDTOSchema.parse(input);
  const user = await verifyUserCredentials({
    email: parsed.email,
    password: parsed.password,
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  await setAccessTokenCookie(await generateAccessToken(user));
  redirect("/dashboard");
}
