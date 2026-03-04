import { getUser } from "@/lib/auth/userFromToken";
import DashBoard from "./DashBoard";

export default async function DashboardPage() {
  const user = await getUser();
  return (
    <DashBoard user={user}/>
  );
}
