"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import URLForm from './_components/URLForm';
import ScanResults from './_components/ScanResults';
import { ScanFinding } from '@/lib/repository/scanFinding/scanFindingSchema';
import { ScanJob } from '@/lib/repository/scanJob/scanJobSchemas';
import { ScanOptions } from './_components/ScanOptions';
import { IgnoreSettingsButtons } from './_components/IgnoreSettings';
import { extensionsUtil } from '@/lib/utils';
import { Settings } from '@/lib/repository/user/userSchemas';
import { getScanSettings } from './ScanSettingsServerActions';






export default function Home() {
  const [scanFindings, setScanFindings] = useState<ScanFinding[] | null>(null);
  const [scanJobs, setScanJob] = useState<ScanJob[] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const extensions = extensionsUtil;
  const [selected, setSelected] = useState(extensions);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Puts the scanjob and scanjob findings in local storage. 
  // If the scanjobs are older than a day, they would get deleted
  useEffect(() => {
    fetch('/api/auth/me') 
      .then((res) => {
        if (res.ok) setIsAuthenticated(true);
      })
      .catch(() => setIsAuthenticated(false));

    async function loadSettings() {
      try {
        const data = await getScanSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    loadSettings();
    setIsDeepScan(settings?.isDeep ?? false)

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
      <div className="px-4 py-10 flex flex-col justify-center items-center gap-8 min-w-96 max-w-130">
        <h1 className="h1">Sniff out vulnerabilities in seconds</h1>

        <p className="p">
          Repo Raccoon scrapes public repositories to provide comprehensive
          security overviews, helping you identify and address potential
          weaknesses.
        </p>

        <URLForm onScanStarted={handleScanSuccess} hasUser={isAuthenticated} isDeepScan={false} extensions={selected}/>
        <ScanOptions isDisabled={!isAuthenticated} isDeep={settings?.isDeep ?? false} onDeepChange={(isDeep) => setIsDeepScan(isDeep)} />
        <IgnoreSettingsButtons onSelectedChange={(selected) => setSelected(selected)} extensions={selected}/>
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
      <div className='inline-flex justify-start items-start gap-40'>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-20 w-full max-w-4xl px-4">
          <div className="box !bg-background/40 backdrop-blur-md border border-secondary/10 overflow-hidden shadow-xl p-8 flex-1 min-h-[300px] transition-all hover:border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-text-main">Why?</h2>
              </div>
            </div>

            <p className="p text-left leading-relaxed border-t border-secondary/10 pt-4 text-secondary">
              Have you ever lost 1000's of dollars because a junior
              developer pushed an API key? Our goal is to prevent scenarios like this
              with automated security overviews and weekly reviews.
            </p>
          </div>

          <div className="box !bg-background/40 backdrop-blur-md border border-secondary/10 overflow-hidden shadow-xl p-8 flex-1 min-h-[300px] transition-all hover:border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-black text-text-main">How?</h1>
              </div>
            </div>

            <p className="p text-left leading-relaxed border-t border-secondary/10 pt-4 text-secondary">
              Using proprietary indexing technology,
              Repo Raccoon sniffs through your repository history to identify
              vulnerabilities like hardcoded API keys, database credentials, or hidden secrets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}