import { getUser } from "@/lib/auth/userFromToken";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user?.email_confirmed) {
    redirect("/confirm-email/pending");
  }

  return (
    <div>
      This is a secret page that requires authentication.
      <p>{JSON.stringify(user)}</p>
    </div>
  );
}