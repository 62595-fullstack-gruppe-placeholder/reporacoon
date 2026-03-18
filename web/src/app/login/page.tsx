import { getUser } from "@/lib/auth/userFromToken";
import { LoginForm } from "./LoginForm";
import { redirect } from "next/navigation";

export default async function Login() {
  let user = await getUser()
  if (user) {
    redirect("/dashboard")
  }
  return <LoginForm />;
}
