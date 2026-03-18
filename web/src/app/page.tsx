"use client";

import { useEffect, useState } from "react";
import URLForm from "./_components/URLForm";
import ScanResults from "./_components/ScanResults";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import { ScanOptions } from "./_components/ScanOptions";

export default function Home() {
  const [scanFindings, setScanFindings] = useState<ScanFinding[] | null>(null);
  const [scanJobs, setScanJob] = useState<ScanJob[] | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Puts the scanjob and scanjob findings in local storage. 
  // If the scanjobs are older than a day, they would get deleted
  useEffect(() => {
    const savedResults = localStorage.getItem('raccoon_scanjob_history');
    if (savedResults) {
      try {
        const { findings, jobs } = JSON.parse(savedResults);

        const ONE_DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();

        const freshJobs = jobs.filter((job: any) => (now - job.scannedAt) < ONE_DAY);
        const freshJobIds = new Set(freshJobs.map((j: any) => j.id));
        const freshFindings = findings.filter((f: any) => freshJobIds.has(f.job_id));

        if (freshJobs.length > 0) {
          setScanFindings(freshFindings);
          setScanJob(freshJobs);
          setIsScanning(true);

          localStorage.setItem('raccoon_scanjob_history', JSON.stringify({
            findings: freshFindings,
            jobs: freshJobs
          }));
        } else {
          localStorage.removeItem('raccoon_scanjob_history');
        }
      } catch (err) {
        console.error("Failed to load/clean history:", err);
      }
    }
  }, []);

  // Combines the new jobs and findings with the old ones and updates the local storage
  const handleScanSuccess = (
    newFindings: ScanFinding[],
    newJobs: ScanJob[],
  ) => {
    const now = Date.now();
    const jobsWithTime = newJobs.map((job) => ({ ...job, scannedAt: now }));

    setScanFindings((prev) => (prev ? [...prev, ...newFindings] : newFindings));
    setScanJob((prev) => (prev ? [...prev, ...jobsWithTime] : jobsWithTime));
    setIsScanning(true);

    const existingData = localStorage.getItem("raccoon_scanjob_history");
    let updatedFindings = newFindings;
    let updatedJobs = jobsWithTime;

    if (existingData) {
      const { findings, jobs } = JSON.parse(existingData);
      updatedFindings = [...findings, ...newFindings];
      updatedJobs = [...jobs, ...jobsWithTime];
    }

    localStorage.setItem(
      "raccoon_scanjob_history",
      JSON.stringify({
        findings: updatedFindings,
        jobs: updatedJobs,
      }),
    );
  };

  return (
    <div className="flex flex-col justify-center items-center gap-8">
      <div className="px-4 py-10 flex flex-col justify-center items-center gap-8 min-w-96 max-w-125">
        <h1 className="h1">Sniff out vulnerabilities in seconds</h1>

        <p className="p">
          Repo Raccoon scrapes public repositories to provide comprehensive
          security overviews, helping you identify and address potential
          weaknesses.
        </p>

        <URLForm onScanStarted={handleScanSuccess} isDeepScan={false} />
        <ScanOptions isDisabled={true} />
      </div>

      {/* Dashboard appears with fade and slide down animation */}
      <div
        className={`
          w-full max-w-6xl px-4
          transition-all duration-700 ease-out
          ${
            isScanning
              ? "opacity-100 translate-y-0 max-h-[1000px]"
              : "opacity-0 -translate-y-10 max-h-0 overflow-hidden"
          }
        `}
      >
        <ScanResults findings={scanFindings} jobs={scanJobs} />
        {isScanning && (
          <button
            onClick={() => {
              localStorage.removeItem("raccoon_scanjob_history");
              setIsScanning(false);
              setScanFindings(null);
              setScanJob(null);
            }}
            className="mt-4 text-xs font-mono text-secondary hover:text-red-400 transition-colors underline"
          >
            Clear scan history
          </button>
        )}
      </div>
      <div className="inline-flex justify-start items-start gap-40">
        <div className="box w-80 h-72">
          <h1 className="h1 border-b border-secondary flex justify-center items-center gap-2.5 p-2.5">
            Why?
          </h1>
          <p className="p self-stretch px-4 pt-2">
            Have you ever lost 1000's of dollars because a junior developer
            pushed an API key? Our goal is to prevent scenarios like this, with
            security overviews and weekly reviews.
          </p>
        </div>

        <div className="box w-80 h-72">
          <h1 className="h1 border-b border-secondary flex justify-center items-center gap-2.5 p-2.5">
            How?
          </h1>
          <p className="p self-stretch px-4 pt-2">
            Using a proprietary indexing technology, Repo Raccoon searches your
            repository for any vulnerabilites, like API keys or other secrets.
          </p>
        </div>
      </div>
    </div>
  );
}
