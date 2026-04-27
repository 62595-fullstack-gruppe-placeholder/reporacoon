"use client";

import { AlertTriangle, ShieldCheck, Zap } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 space-y-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="box border border-secondary/10 overflow-hidden shadow-xl bg-background/50 backdrop-blur-sm p-8 text-center mb-8">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl inline-flex mb-6">
            <AlertTriangle className="text-red-400" size={48} />
          </div>

          <h1 className="h1 mb-4">Something went wrong</h1>

          <p className="text-secondary font-mono text-sm leading-relaxed max-w-md mx-auto">
            An unexpected error occurred. You can try again or return to your
            dashboard.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={reset}
            className="box flex items-center gap-3 px-8 py-4 font-mono font-bold text-sm uppercase tracking-wider bg-button-main/20 hover:bg-button-main/30 border-2 border-button-main/30 hover:border-button-main text-button-main hover:shadow-lg transition-all h-12"

          >
            <Zap size={16} />
            Try again
          </button>

          <a
            href="/dashboard"
            className="box flex items-center gap-3 px-8 py-4 font-mono font-bold text-sm uppercase tracking-wider bg-button-main/20 hover:bg-button-main/30 border-2 border-button-main/30 hover:border-button-main text-button-main hover:shadow-lg transition-all h-12"

          >
            <ShieldCheck size={16} />
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
