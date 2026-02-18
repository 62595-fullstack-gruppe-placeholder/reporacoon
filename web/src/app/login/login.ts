"use server";

import { verifyUserCredentials } from "@/lib/repository/user/userRepository";
import {
  type CredentialsDTO,
  loginFormSchema,
} from "@/lib/repository/user/userSchemas";
import { cookies } from "next/headers";

export async function login(input: CredentialsDTO) {
  const parsed = loginFormSchema.parse(input);
  const user = await verifyUserCredentials({
    email: parsed.email,
    password: parsed.password,
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  (await cookies()).set("auth", "true");

  return true;
}
