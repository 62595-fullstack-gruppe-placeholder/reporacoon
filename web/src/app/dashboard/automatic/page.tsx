import { getUser } from "@/lib/auth/userFromToken";
import { ShieldCheck, GitBranch } from "lucide-react";
import RepoSignupForm from "./RepoSignupForm";
import { getUserListeningRepositories } from "@/lib/repository/listeningRepository/listeningRepositoryRepository";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function RepoSignupPage() {
  const user = await getUser();
  if (!user) {
    return <div>You must be logged in to view this page.</div>;
  }

  const userRepos = await getUserListeningRepositories(user.id);

  return (
    <div className="w-full flex justify-center">
      <div className="w-3/4 space-y-12 py-12">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-4 rounded-lg bg-button-main/20 inline-flex">
            <ShieldCheck className="text-button-main" size={40} />
          </div>
          <h1 className="h1 font-black text-text-main">
            Connect your repositories
          </h1>
          <p className="text-secondary font-mono text-sm leading-relaxed max-w-lg mb-3">
            Register your repositories for automatic scans whenever you push new
            commits.
          </p>
        </div>

        <div className="box border border-secondary/10 shadow-xl bg-background/60 backdrop-blur-sm p-8 space-y-8">
          <div className="border-b border-secondary/10 pb-4 flex items-center gap-3">
            <GitBranch className="text-button-main" size={18} />
            <h2 className="text-lg font-black text-text-main">
              Repository setup
            </h2>
          </div>

          <RepoSignupForm existingRepos={userRepos} />
        </div>
      </div>
    </div>
  );
}
