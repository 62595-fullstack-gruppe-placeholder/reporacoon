"use client";

import ScanResults from "@/app/_components/ScanResults";
import URLForm from "@/app/_components/URLForm";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import { GitBranch, Zap } from "lucide-react";
import { useState } from "react";

export function TryItYourself({
  postScanCallback,
  tried,
}: {
  postScanCallback: () => void;
  tried: boolean;
}) {
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [job, setJob] = useState<ScanJob | null>(null);

  return (
    <div className="mt-12 pt-8">
      <div className="text-center space-y-6">
        <div className="max-w-md mx-auto space-y-3">
          {tried ? (
            <>
              <h1 className="h1">It's that easy!</h1>
              <p>You've just scanned your first repository</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-black text-text-main">
                Want to try scanning your own repos?
              </h2>
              <p className="text-secondary">
                Scan any public repository instantly
              </p>
            </>
          )}
        </div>

        {/* URL Form - matches landing page style */}
        <div className="field flex items-center gap-2 justify-center max-w-md mx-auto">
          <GitBranch className="text-secondary" size={20} />
          <URLForm
            onScanStarted={(findings, jobs) => {
              setJob(jobs[0]);
              setFindings(findings);
              postScanCallback();
            }}
            isDeepScan={false}
          />
        </div>

        <div className="pt-4 text-center">
          <p className="text-sm text-secondary mb-4 font-mono">
            {job === null
              ? "Or sign up for recurring jobs and custom scanning rules"
              : "Sign up to automatically run this scan on a schedule"}
          </p>
          <a
            href="/signup"
            className="box inline-flex items-center gap-3 px-6 py-3 font-mono font-bold text-sm uppercase tracking-wider bg-button-main/20 hover:bg-button-main/30 border-2 border-button-main/30 hover:border-button-main text-button-main hover:shadow-lg transition-all"
          >
            {job === null ? "Get started" : "Sounds good - sign me up"}
            <Zap size={16} />
          </a>
        </div>

        {job && <ScanResults jobs={[job]} findings={findings} />}
      </div>
    </div>
  );
}
