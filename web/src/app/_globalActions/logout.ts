"use server";

import { deleteAuthCookies } from "@/lib/auth/cookies";
import { getUser } from "@/lib/auth/userFromToken";
import { revokeUserRefreshTokens } from "@/lib/repository/refreshToken/refreshTokenRepository";
import { redirect } from "next/navigation";

export async function logout() {
  const user = await getUser();
  if (user) await revokeUserRefreshTokens(user.id);
  await deleteAuthCookies();
  redirect("/");
}
