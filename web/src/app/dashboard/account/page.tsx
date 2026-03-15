import { getUser } from "@/lib/auth/userFromToken";
import { User } from "@/lib/repository/user/userSchemas";
import { AccountDashboard } from "./PageContent";

export default async function Page() {
  const user = (await getUser()) as User;
  return <AccountDashboard user={user} />;
}
