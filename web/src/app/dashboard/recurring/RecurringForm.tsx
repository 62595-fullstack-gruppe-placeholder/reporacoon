"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Search, Trash2, Pause, Play, RefreshCw, ChevronDown, Lock } from "lucide-react";
import { RecursiveScan, SCAN_INTERVALS, ScanInterval } from "@/lib/repository/recursiveScan/recursiveScanSchema";
import {
  createRecursiveScanAction,
  deleteRecursiveScanAction,
  toggleRecursiveScanAction,
  runRecursiveScanNowAction,
  getRecurringScanResultsAction,
} from "@/app/RecursiveScanServerActions";
import ScanResults from "@/app/_components/ScanResults";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { Settings } from "@/lib/repository/user/userSchemas";

// Labels for the scan intervals used in the dropdown and scan list.
const INTERVAL_LABELS: Record<ScanInterval, string> = {
  EVERY_MINUTE: "Every minute (test)",
  HOURLY: "Every hour",
  DAILY: "Every day",
  WEEKLY: "Every week",
  MONTHLY: "Every month",
  YEARLY: "Every year",
};

export function RecurringForm({ 
  initialScans, 
  isDeep, 
  extensions,
  hasUser = true // Added hasUser to determine if private scans are allowed
}: { 
  initialScans: RecursiveScan[], 
  isDeep: boolean, 
  extensions: Set<string>,
  hasUser?: boolean 
}) {
  const [url, setUrl] = useState("");
  const [repoType, setRepoType] = useState<"public" | "private">("public");
  const [repoKey, setRepoKey] = useState("");
  const [interval, setInterval] = useState<ScanInterval>("WEEKLY");
  const [isDeepScan, setIsDeepScan] = useState(isDeep);
  const [extensionsState, setExtensionsState] = useState(extensions);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Ensure repoType reverts to public if user logs out or hasUser becomes false
  useEffect(() => {
    if (!hasUser && repoType === "private") {
      setRepoType("public");
      setRepoKey("");
    }
  }, [hasUser, repoType]);

  // Handles form submission for creating a new recurring scan.
  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // Pass the repoKey only if the repository is private
      const finalRepoKey = (hasUser && repoType === "private") ? repoKey : null;
      
      const result = await createRecursiveScanAction(
        url, 
        finalRepoKey,
        interval, 
        isDeepScan, 
        extensionsState,
      );
      
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
      } else {
        setUrl("");
        setRepoType("public");
        setRepoKey("");
      }
    });
  }

  return (
    <div className="space-y-6 flex flex-col items-center">
      {/* Create form */}
      <div className="w-full max-w-2xl bg-box border border-border rounded-[14px] p-6">
        <div className="flex flex-row gap-3 items-center mb-6">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <RefreshCw className="text-text-main" size={18} />
          </div>
          <h2 className="text-lg font-bold text-text-main font-mono">Schedule a recurring scan</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          {/* ROW 1: Repo type toggle */}
          <div className="flex items-center gap-4">
            <span className="text-secondary text-[10px] tracking-[0.14em] uppercase font-mono mt-0.5">
              Repository type
            </span>
            <div className="flex border border-border rounded-lg overflow-hidden">
              {(["public", "private"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (type === "private" && !hasUser) return;
                    setRepoType(type);
                  }}
                  disabled={type === "private" && !hasUser}
                  className={`
                    px-4 py-1.5 text-xs font-mono capitalize transition-all outline-none border-r border-border last:border-r-0
                    ${repoType === type
                      ? "bg-secondary/20 text-text-main"
                      : "bg-transparent text-secondary hover:bg-background/50"}
                    disabled:opacity-40 disabled:cursor-not-allowed
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* ROW 2: URL input */}
          <div className="relative flex-1 min-w-0 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search
                width={16}
                height={16}
                className="text-secondary group-focus-within:text-text-main transition-colors"
                strokeWidth={2}
              />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 outline-none text-text-main placeholder:text-secondary/70 font-mono text-sm focus:border-button-main transition-colors"
              placeholder="Paste a Git repository URL"
              required
            />
          </div>

          {/* Private repo key input */}
          {hasUser && repoType === "private" && (
            <div className="relative w-full animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none pb-[26px]">
                <Lock width={15} height={15} className="text-secondary" strokeWidth={2} />
              </div>
              <input
                type="password"
                value={repoKey}
                onChange={(e) => setRepoKey(e.target.value)}
                required={repoType === "private"}
                placeholder="Enter your personal access token"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 outline-none text-text-main placeholder:text-secondary/70 font-mono text-sm focus:border-button-main transition-colors"
              />
              <p className="text-[11px] text-secondary font-mono mt-2 ml-1">
                Your token is encrypted and used only for these scans.
              </p>
            </div>
          )}

          {/* ROW 3: Interval and Submit */}
          <div className="flex items-center justify-between gap-4 w-full mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="text-secondary text-[10px] tracking-[0.14em] uppercase font-mono">
                Interval
              </span>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as ScanInterval)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:border-button-main font-mono text-sm"
              >
                {SCAN_INTERVALS.map((i) => (
                  <option key={i} value={i}>{INTERVAL_LABELS[i]}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="bg-button-main text-background font-mono text-sm px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isPending ? "Scheduling..." : "Schedule Scan"}
            </button>
          </div>

          {error && <p className="text-xs text-red-500 font-mono mt-1 ml-1">{error}</p>}
        </form>
      </div>

      {/* Existing schedules */}
      <div className="w-full max-w-2xl bg-box border border-border rounded-[14px] overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-text-main font-mono">Your recurring scans</h2>
        </div>

        {initialScans.length === 0 ? (
          <p className="p-6 text-secondary font-mono text-sm">No recurring scans yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {initialScans.map((scan) => (
              <RecurringScanRow key={scan.id} scan={scan} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RecurringScanRow({ scan }: { scan: RecursiveScan }) {
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);
  const [jobs, setJobs] = useState<ScanJob[] | null>(null);
  const [findings, setFindings] = useState<ScanFinding[] | null>(null);

  const fetchResults = useCallback(async () => {
    const result = await getRecurringScanResultsAction(scan.id);
    if (result.success) {
      setJobs(result.jobs);
      setFindings(result.findings);
    }
  }, [scan.id]);

  useEffect(() => {
    if (!isExpanded) return;
    fetchResults();
    const interval = setInterval(fetchResults, 15000);
    return () => clearInterval(interval);
  }, [isExpanded, fetchResults]);

  function handleDelete() {
    startTransition(async () => { await deleteRecursiveScanAction(scan.id); });
  }

  function handleToggle() {
    startTransition(async () => { await toggleRecursiveScanAction(scan.id); });
  }

  function handleRunNow() {
    startTransition(async () => { await runRecursiveScanNowAction(scan.id); });
  }

  function handleExpand() {
    setIsExpanded((v) => !v);
  }

  return (
    <li className="bg-background/30 hover:bg-background/50 transition-colors">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        <button
          className="flex-1 min-w-0 text-left outline-none"
          onClick={handleExpand}
        >
          <p className="text-text-main font-mono text-sm truncate">{scan.repo_url}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-secondary font-mono">
            <span className="bg-secondary/10 px-2 py-0.5 rounded-md">{INTERVAL_LABELS[scan.interval]}</span>
            <span className="bg-secondary/10 px-2 py-0.5 rounded-md">{scan.is_deep_scan ? "Deep scan" : "Shallow scan"}</span>
            {scan.last_run_at && (
              <span className="flex items-center">Last: {new Date(scan.last_run_at).toLocaleDateString()}</span>
            )}
            <span className="flex items-center">Next: {new Date(scan.next_run_at).toLocaleDateString()}</span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] tracking-wider uppercase font-mono px-2.5 py-1 rounded-full ${scan.is_active ? "bg-button-main/20 text-button-main" : "bg-secondary/20 text-secondary"}`}>
            {scan.is_active ? "Active" : "Paused"}
          </span>

          <div className="flex items-center ml-2 border border-border rounded-lg overflow-hidden">
            <button
              onClick={handleRunNow}
              disabled={isPending}
              className="p-2 bg-background hover:bg-secondary/10 disabled:opacity-50 text-secondary hover:text-text-main transition-colors border-r border-border"
              title="Run now"
            >
              <RefreshCw size={14} />
            </button>

            <button
              onClick={handleToggle}
              disabled={isPending}
              className="p-2 bg-background hover:bg-secondary/10 disabled:opacity-50 text-secondary hover:text-text-main transition-colors border-r border-border"
              title={scan.is_active ? "Pause" : "Resume"}
            >
              {scan.is_active ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-2 bg-background hover:bg-red-500/10 text-red-400 disabled:opacity-50 transition-colors border-r border-border"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>

            <button 
              onClick={handleExpand} 
              className="p-2 bg-background hover:bg-secondary/10 text-secondary hover:text-text-main transition-colors"
            >
              <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-border/50 bg-box">
          {isPending && jobs === null ? (
            <p className="text-sm font-mono text-secondary">Loading results...</p>
          ) : jobs && jobs.length === 0 ? (
            <p className="text-sm font-mono text-secondary">No scans have run yet.</p>
          ) : (
            <ScanResults jobs={jobs} findings={findings} />
          )}
        </div>
      )}
    </li>
  );
}