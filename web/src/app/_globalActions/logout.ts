"use server";

import { deleteAccessTokenCookie } from "@/lib/auth/cookies";
import { redirect } from "next/navigation";

export async function logout() {
  await deleteAccessTokenCookie();
  // TODO: delete refresh token cookie
  redirect("/");
}
