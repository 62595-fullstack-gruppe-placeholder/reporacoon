import { getUser } from "@/lib/auth/userFromToken";
import DashBoard from "./DashBoard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getUser();
  
  return (
    <DashBoard user={user}/>
  );
}