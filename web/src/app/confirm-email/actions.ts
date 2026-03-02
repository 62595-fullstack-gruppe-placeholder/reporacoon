"use server";

import { setAccessTokenCookie } from "@/lib/auth/cookies";
import { generateAccessToken } from "@/lib/auth/accessToken";
import { redirect } from "next/navigation";

export async function createSessionFromConfirmedUser(user: any) {
  const accessToken = await generateAccessToken(user);
  await setAccessTokenCookie(accessToken);
  redirect("/dashboard");
}