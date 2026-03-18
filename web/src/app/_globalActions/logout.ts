"use server";

import { deleteAccessTokenCookie, deleteRefreshTokenCookie } from "@/lib/auth/cookies";
import { getUser } from "@/lib/auth/userFromToken";
import { revokeUserRefreshTokens } from "@/lib/repository/refreshToken/refreshTokenRepository";
import { redirect } from "next/navigation";

export async function logout() {
  await deleteAccessTokenCookie();
  await deleteRefreshTokenCookie();
  const user = await getUser();
  if (user) await revokeUserRefreshTokens(user.id);
  redirect("/");
}
