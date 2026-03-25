"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Search, Trash2, Pause, Play, RefreshCw, ChevronDown } from "lucide-react";
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



// Labels for the scan intervals used in the dropdown and scan list.
const INTERVAL_LABELS: Record<ScanInterval, string> = {
  EVERY_MINUTE: "Every minute (test)",
  HOURLY: "Every hour",
  DAILY: "Every day",
  WEEKLY: "Every week",
  MONTHLY: "Every month",
  YEARLY: "Every year",
};



// The main component for managing recurring scans. 
// It includes a form for creating new scans and a list of existing scans with controls to manage them.
export function RecurringForm({ initialScans }: { initialScans: RecursiveScan[] }) {
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState<ScanInterval>("WEEKLY");
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

// Handles form submission for creating a new recurring scan. 
// It calls the server action and manages loading and error states.
  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createRecursiveScanAction(url, interval, isDeepScan);
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
      } else {
        setUrl("");
      }
    });
  }








  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="box border border-secondary/10 shadow-xl">
        <div className="p-6 border-b border-secondary/10">
          <div className="flex flex-row gap-4 items-center">
            <div className="p-2 bg-button-main/20 rounded-lg">
              <RefreshCw className="text-button-main" size={20} />
            </div>
            <h2 className="text-lg font-black text-text-main">Schedule a recurring scan</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* URL input */}
          <div className="field flex items-center gap-2">
            <Search width={20} height={20} color="#a1b5a6" strokeWidth={2} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="fieldText flex-1 bg-transparent outline-none"
              placeholder="Paste a public GitHub repository URL"
              required
            />
          </div>

          <div className="flex items-center gap-6">
            {/* Interval dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-text-main/60">Scan interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as ScanInterval)}
                className="bg-box border border-secondary/20 rounded-md px-3 py-2 text-text-main outline-none focus:border-button-main"
              >
                {SCAN_INTERVALS.map((i) => (
                  <option key={i} value={i}>{INTERVAL_LABELS[i]}</option>
                ))}
              </select>
            </div>

            {/* Deep scan toggle */}
            <div className="flex items-center gap-2 mt-5">
              <input
                id="deep-scan"
                type="checkbox"
                checked={isDeepScan}
                onChange={(e) => setIsDeepScan(e.target.checked)}
                className="accent-button-main w-4 h-4"
              />
              <label htmlFor="deep-scan" className="text-sm text-text-main">Deep scan</label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="bg-button-main btn mt-5 disabled:opacity-50"
            >
              {isPending ? "Scheduling..." : "Schedule scan"}
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </div>

      {/* Existing schedules */}
      <div className="box border border-secondary/10 shadow-xl">
        <div className="p-6 border-b border-secondary/10">
          <h2 className="text-lg font-black text-text-main">Your recurring scans</h2>
        </div>

        {initialScans.length === 0 ? (
          <p className="p-6 text-text-main/50 text-sm">No recurring scans yet.</p>
        ) : (
          <ul>
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
  // null = not yet fetched; empty array = fetched but no results
  const [jobs, setJobs] = useState<ScanJob[] | null>(null);
  const [findings, setFindings] = useState<ScanFinding[] | null>(null);

  // Wrapped in useCallback so the useEffect dependency array stays stable
  // and doesn't re-create the interval on every render
  const fetchResults = useCallback(async () => {
    const result = await getRecurringScanResultsAction(scan.id);
    if (result.success) {
      setJobs(result.jobs);
      setFindings(result.findings);
    }
  }, [scan.id]);

  // Fetch results immediately when the row expands, then poll every 15 seconds
  // so the user can see a running scan complete without manually refreshing.
  // The cleanup function clears the interval when the row collapses.
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

  // Triggers an immediate scan run without affecting the scheduled next_run_at
  function handleRunNow() {
    startTransition(async () => { await runRecursiveScanNowAction(scan.id); });
  }

  function handleExpand() {
    setIsExpanded((v) => !v);
  }

  return (
    <li className="border-b border-secondary/10 last:border-b-0">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        <button
          className="flex-1 min-w-0 text-left"
          onClick={handleExpand}
        >
          <p className="text-text-main font-medium truncate">{scan.repo_url}</p>
          <div className="flex gap-4 mt-1 text-xs text-text-main/50">
            <span>{INTERVAL_LABELS[scan.interval]}</span>
            <span>{scan.is_deep_scan ? "Deep scan" : "Shallow scan"}</span>
            {scan.last_run_at && (
              <span>Last run: {new Date(scan.last_run_at).toLocaleString()}</span>
            )}
            <span>Next run: {new Date(scan.next_run_at).toLocaleString()}</span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${scan.is_active ? "bg-button-main/20 text-button-main" : "bg-secondary/20 text-text-main/50"}`}>
            {scan.is_active ? "Active" : "Paused"}
          </span>

          <button
            onClick={handleRunNow}
            disabled={isPending}
            className="p-2 rounded-md hover:bg-secondary/10 disabled:opacity-50"
            title="Run now"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={handleToggle}
            disabled={isPending}
            className="p-2 rounded-md hover:bg-secondary/10 disabled:opacity-50"
            title={scan.is_active ? "Pause" : "Resume"}
          >
            {scan.is_active ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 rounded-md hover:bg-red-500/10 text-red-400 disabled:opacity-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>

          <button onClick={handleExpand} className="p-2 rounded-md hover:bg-secondary/10">
            <ChevronDown size={16} className={`text-secondary transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6">
          {isPending && jobs === null ? (
            <p className="text-sm text-text-main/50">Loading...</p>
          ) : jobs && jobs.length === 0 ? (
            <p className="text-sm text-text-main/50">No scans have run yet.</p>
          ) : (
            <ScanResults jobs={jobs} findings={findings} />
          )}
        </div>
      )}
    </li>
  );
}
