import { getUser } from "@/lib/auth/userFromToken";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return <div>dashboard</div>;
}
