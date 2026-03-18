import { getUser } from "@/lib/auth/userFromToken";
import { SignupForm } from "./SignupForm";
import { redirect } from "next/navigation";

export default async function Signup() {
  let user = await getUser()
    if (user) {
      redirect("/dashboard")
    }
  return <SignupForm />;
}
