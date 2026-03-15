import { getUser } from "@/lib/auth/userFromToken";
import { AccountDashboard } from "./PageContent";

export default async function Page() {
  const user = await getUser();

  if (!user) {
    return <div>You must be logged in to view this page.</div>
  }

  return <AccountDashboard user={user} />;
}
