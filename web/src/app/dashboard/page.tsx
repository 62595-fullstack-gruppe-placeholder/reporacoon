import { ShieldCheck } from "lucide-react";
import JobsTable from "@/app/_components/JobsTable";
import { SeeAllJobsButton } from "./SeeAllJobsButton";
import { getUserScanJobs } from "@/lib/repository/scanJob/scanJobRepository";
import { getUser } from "@/lib/auth/userFromToken";
import DashBoard from "./DashBoard";
import { redirect } from "next/navigation";
import { getUserSettingsById } from "@/lib/repository/user/userRepository";
import { getScanSettings } from "../ScanSettingsServerActions";


    

// force dynamic rendering for this page
export const dynamic = "force-dynamic";
    
export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    return null;
  }
  const initialSettings = await getScanSettings()
  if (!initialSettings) {
    return null;
  }
  if (!user) {
    throw new Error("Authentication required");
  }

  const recentJobs = await getUserScanJobs(user.id, 5);

  return (
    <div className="w-full">
      <DashBoard user={user} settings={initialSettings}/>
      <div className="space-y-8 w-3/4 mx-auto">
        <div className="box border border-secondary/10 shadow-xl mt-8">
          <div className="p-6 border-b border-secondary/10">
            <div className="flex gap-3 justify-between">
              <div className="flex flex-row gap-4 items-center">
                <div className="p-2 bg-button-main/20 rounded-lg">
                  <ShieldCheck className="text-button-main" size={20} />
                </div>
                <h2 className="text-lg font-black text-text-main">
                  Your last scan jobs
                </h2>
              </div>
              <SeeAllJobsButton />
            </div>
          </div>

          <JobsTable jobs={recentJobs} />
        </div>
      </div>
    </div>
  );
}
