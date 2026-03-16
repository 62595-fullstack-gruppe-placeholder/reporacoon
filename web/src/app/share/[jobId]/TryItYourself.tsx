"use client";

import URLForm from "@/app/_components/URLForm";
import { GitBranch, Zap } from "lucide-react";

export function TryItYourself() {
  return (
    <div className="mt-12 pt-8 border-t border-secondary/10">
      <div className="text-center space-y-6">
        <div className="max-w-md mx-auto space-y-3">
          <h2 className="text-xl font-black text-text-main">
            Want to try scanning your own repos?
          </h2>
          <p className="text-secondary">
            Scan any public repository instantly or sign up for recurring scans
            and custom rules.
          </p>
        </div>

        {/* URL Form - matches landing page style */}
        <div className="field flex items-center gap-2 justify-center max-w-md mx-auto">
          <GitBranch className="text-secondary" size={20} />
          <URLForm onScanStarted={() => {}} isDeepScan={false} />
        </div>

        <div className="pt-4 text-center">
          <p className="text-sm text-secondary mb-4 font-mono">
            Or sign up for recurring jobs and custom scanning rules
          </p>
          <a
            href="/signup"
            className="box inline-flex items-center gap-3 px-6 py-3 font-mono font-bold text-sm uppercase tracking-wider 
                 bg-button-main/20 hover:bg-button-main/30 border-2 border-button-main/30 
                 hover:border-button-main text-button-main hover:shadow-lg transition-all"
          >
            Get started
            <Zap size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
