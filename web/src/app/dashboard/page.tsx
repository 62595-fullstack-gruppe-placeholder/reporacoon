import { ShieldCheck } from "lucide-react";
import JobsTable from "@/app/_components/JobsTable";
import { SeeAllJobsButton } from "./SeeAllJobsButton";
import { getUserScanJobs } from "@/lib/repository/scanJob/scanJobRepository";
import { getUser } from "@/lib/auth/userFromToken";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const recentJobs = await getUserScanJobs(user.id, 5);

  return (
    <div className="w-full">
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
