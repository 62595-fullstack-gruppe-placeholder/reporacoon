import Link from "next/link";
import { ShieldCheck, Zap, AlertTriangle, GitBranch } from "lucide-react";
import { ScanJobWithFindingsCount } from "@/lib/repository/scanJob/scanJobSchemas";

interface Props {
  jobs: ScanJobWithFindingsCount[];
}

export default function JobsTable({ jobs }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="p-12 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-secondary mb-4" />
        <p className="text-secondary font-mono text-sm">
          No scan jobs yet. Run your first scan!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-secondary/10">
            <th className="text-left p-4 font-mono text-xs uppercase text-secondary tracking-wider">
              Repository
            </th>
            <th className="text-left p-4 font-mono text-xs uppercase text-secondary tracking-wider">
              Status
            </th>
            <th className="text-left p-4 font-mono text-xs uppercase text-secondary tracking-wider">
              Duration
            </th>
            <th className="text-left p-4 font-mono text-xs uppercase text-secondary tracking-wider">
              Findings
            </th>
            <th className="text-left p-4 font-mono text-xs uppercase text-secondary tracking-wider">
              Scanned
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-b border-secondary/5 hover:bg-white/5 transition-colors"
            >
              <td className="p-4">
                <Link
                  href={`/dashboard/job/${job.id}`}
                  className="font-black text-text-main hover:text-button-main transition-colors truncate max-w-xs block"
                >
                  {job.repo_url.split("/").slice(-2).join("/")}
                </Link>
              </td>
              <td className="p-4">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    job.status === "PARSED" || job.status === "PENDING"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : job.status === "FAILED"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  }`}
                >
                  {job.status.toLowerCase()}
                </span>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-1.5 text-sm font-mono text-text-main">
                  <Zap size={12} className="text-orange-400" />
                  <span>{job.duration || 0}s</span>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-1.5 text-sm font-mono text-red-500 font-bold">
                  <AlertTriangle size={12} />
                  <span>{job.findings_count || 0}</span>
                </div>
              </td>
              <td className="p-4">
                <span className="text-sm font-mono text-secondary">
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
