"use server";

import { getUser } from "@/lib/auth/userFromToken";
import { changeUserPassword } from "@/lib/repository/user/userRepository";
import {
  ChangePasswordDTO,
  changePasswordDTOSchema,
} from "@/lib/repository/user/userSchemas";

export async function changePassword(dto: Omit<ChangePasswordDTO, "userId">) {
  const user = await getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const validated = changePasswordDTOSchema.omit({ userId: true }).parse(dto);

  await changeUserPassword({ ...validated, userId: user.id });

  return { success: true, error: undefined };
}
