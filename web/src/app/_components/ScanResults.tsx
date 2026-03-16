"use client";

import { useState } from "react";
import {
  ChevronDown,
  ShieldCheck,
  Zap,
  List,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import { ScanFinding } from "../../lib/repository/scanFinding/scanFindingSchema";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import { CopyLinkButton } from "./CopyLinkButton";

interface Props {
  findings: ScanFinding[] | null;
  jobs: ScanJob[] | null; // Changed to plural
}

type MergedFinding = Omit<ScanFinding, "branch"> & {
  branches: string[];
  branchesText: string;
};

export default function ScanResults({ findings, jobs }: Props) {
  if (!findings || !jobs || jobs.length === 0) return null;
  // Used for sorting the findings
  const severityOrder = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3,
  };

  const mergeFindings = (findingsForJob: ScanFinding[]): MergedFinding[] => {
    const map = new Map<string, MergedFinding>();

    for (const f of findingsForJob) {
      const key = `${f.line_number}-${f.rule}-${f.code_snippet}-${f.severity}`;
      const existing = map.get(key);

      if (existing) {
        if (!existing.branches.includes(f.branch)) {
          existing.branches.push(f.branch);
          existing.branchesText = existing.branches.join(", ");
        }
      } else {
        const branches = [f.branch];
        map.set(key, {
          ...f,
          branches,
          branchesText: branches.join(", "),
        });
      }
    }

    return Array.from(map.values());
  };

  return (
    <div className="w-full space-y-6">
      {jobs.map((job) => {
        const jobFindings = findings
          .filter((f) => f.job_id === job.id)
          .sort(
            (f1, f2) => severityOrder[f2.severity] - severityOrder[f1.severity],
          );

        const mergedFindings = mergeFindings(jobFindings);

        const properFindings: ScanFinding[] = mergedFindings.map((mf) => ({
          ...mf,
          branch: mf.branchesText, // pick first branch
        }));

        // use mergedFindings directly
        return (
          <JobAccordion
            key={job.id || job.repo_url}
            job={job}
            findings={mergedFindings}
          />
        );
      })}
    </div>
  );
}

function JobAccordion({
  job,
  findings,
}: {
  job: ScanJob;
  findings: MergedFinding[];
}) {
  const [isMainOpen, setIsMainOpen] = useState(false);

  return (
    <div className="box border border-secondary/10 overflow-hidden shadow-xl transition-all duration-300">
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsMainOpen(!isMainOpen)}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-button-main/20 rounded-lg">
            <ShieldCheck className="text-button-main" size={24} />
          </div>
          <div>
            <h2 className="text-[10px] font-mono text-secondary uppercase tracking-widest leading-none mb-1">
              Security Report
            </h2>
            <h1 className="text-lg font-black text-text-main truncate max-w-[200px] md:max-w-md lg:max-w-full">
              {job.repo_url.split("/").slice(-2).join("/")}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:flex items-center gap-4 border-r border-secondary/20 pr-6 mr-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-secondary">
                Duration
              </span>
              <div className="flex items-center gap-1.5 text-sm font-mono text-text-main">
                <Zap size={12} className="text-orange-400" />
                <span>{job.duration || 0}s</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-secondary">
                Status
              </span>
              <div className="flex items-center gap-1.5 text-sm font-mono text-button-main font-bold">
                <span className="capitalize">{job.status}</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-secondary">
                Findings
              </span>
              <div className="flex items-center gap-1.5 text-sm font-mono text-red-500 font-bold">
                <AlertTriangle size={12} />
                <span>{findings.length}</span>
              </div>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <CopyLinkButton label="Share scan" link={`${process.env.NEXT_PUBLIC_APP_URL}/share/${job.id}`} />
          </div>
          <div
            className={`transition-transform duration-300 ${isMainOpen ? "rotate-180" : ""}`}
          >
            <ChevronDown size={24} className="text-secondary" />
          </div>
        </div>
      </div>

      {isMainOpen && (
        <div className="border-t border-secondary/10 bg-background/50 p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <List size={16} />
            <span className="text-xs font-bold uppercase tracking-tighter">
              Detailed Analysis
            </span>
          </div>

          <div className="space-y-3">
            {findings.map((finding) => (
              <FindingItem key={finding.id} finding={finding} />
            ))}

            {findings.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-secondary/10 rounded-xl">
                <p className="text-secondary font-mono text-sm">
                  No vulnerabilities detected for this job. 🦝
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FindingItem({ finding }: { finding: MergedFinding }) {
  const [isOpen, setIsOpen] = useState(false);

  const severityMap: Record<string, string> = {
    CRITICAL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    HIGH: "bg-red-500/10 text-red-400 border-red-500/20",
    MEDIUM: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    LOW: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  return (
    <div className="bg-background/40 border border-white/5 rounded-xl overflow-hidden transition-all hover:border-white/20">
      <div
        className="flex justify-between items-center px-4 py-3 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityMap[finding.severity] || severityMap.LOW}`}
          >
            {finding.severity}
          </span>
          <h3 className="text-sm font-bold text-text-main truncate max-w-[200px] md:max-w-md">
            {finding.rule?.replace(/_/g, " ")}
          </h3>
          <div className="flex items-end gap-2">
            <GitBranch className="w-6 h-6 text-white" />
            <h3 className="text-sm font-bold text-text-main">
              Branch: {finding.branches.join(" + ")}
            </h3>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="px-4 pb-4">
          <div className="text-[11px] font-mono text-secondary mb-2 border-l-2 border-secondary/30 pl-2">
            {finding.file_path}:{finding.line_number}
          </div>
          <div className="bg-[#0d1117] text-emerald-400 p-3 rounded-lg text-xs font-mono border border-white/5 overflow-x-auto">
            <pre>
              <code>{finding.code_snippet}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
