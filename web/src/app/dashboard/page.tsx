import { getUser } from "@/lib/auth/userFromToken";
import DashBoard from "./DashBoard";
import { redirect } from "next/navigation";
import { getUserSettingsById } from "@/lib/repository/user/userRepository";
import { getScanSettings } from "../ScanSettingsServerActions";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    return null;
  }
  const initialSettings = await getScanSettings()
  if (!initialSettings) {
    return null;
  }
  return (
    <DashBoard user={user} settings={initialSettings}/>
  );
}