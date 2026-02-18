"use server";

import { createUser } from "@/lib/repository/user/userRepository";
import {
  createUserDTOSchema,
  SignupFormSchema,
} from "@/lib/repository/user/userSchemas";
import { cookies } from "next/headers";

/**
 * Input to signup server action.
 */
export type SignupInput = Omit<SignupFormSchema, "confirmPassword">;

/**
 * Signup server action.
 * @param input see {@link SignupInput}.
 */
export async function signup(input: SignupInput) {
  await createUser(
    createUserDTOSchema.parse({
      email: input.email,
      password: input.password,
    }),
  );
  (await cookies()).set("auth", "true");
}
