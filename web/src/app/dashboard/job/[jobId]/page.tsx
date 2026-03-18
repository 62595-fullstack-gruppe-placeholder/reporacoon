import ScanResults from "@/app/_components/ScanResults";
import {
  getFindingsByJobIdServerAction,
  getScanJobByIdServerAction,
} from "@/app/ScanServerActions";
import { GitBranch, Zap } from "lucide-react";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  try {
    const { jobId } = await params;
    const job = await getScanJobByIdServerAction(jobId);
    const findings = await getFindingsByJobIdServerAction(jobId);
    return (
      <div className="w-full">
        <div className="space-y-8 w-3/4 mx-auto my-8">
          <div className="box border border-secondary/10 overflow-hidden shadow-xl bg-background/50 backdrop-blur-sm mb-6">
            <div className="p-6 space-y-4">
              {/* Repo Link */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-button-main/20 rounded-lg">
                  <GitBranch className="text-button-main" size={20} />
                </div>
                <div>
                  <h2 className="text-[10px] font-mono text-secondary uppercase tracking-widest leading-none mb-1">
                    Repository
                  </h2>
                  <a
                    href={job.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-black text-text-main hover:text-button-main underline underline-offset-2 transition-colors truncate max-w-md"
                  >
                    {job.repo_url}
                  </a>
                </div>
              </div>

              {/* Scan Date */}
              <div className="flex items-center gap-3 pt-2 border-t border-secondary/10">
                <div className="p-1.5 bg-orange-500/20 rounded-md">
                  <Zap className="text-orange-400" size={16} />
                </div>
                <div>
                  <h3 className="text-[10px] font-mono text-secondary uppercase tracking-widest leading-none mb-0.5">
                    Scanned
                  </h3>
                  <span className="text-sm font-mono text-text-main">
                    {new Date(job.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <ScanResults jobs={[job]} findings={findings} startOpen />
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
