"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-8">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold text-gray-100 mb-3 tracking-tight">
          Something went wrong
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-8">
          An unexpected error occurred. You can try again or go back to the home page.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="py-3 px-6 rounded-xl border border-gray-800 bg-gray-900 text-gray-200 text-sm font-medium transition-all hover:border-gray-700 hover:bg-gray-800"
          >
            Try again
          </button>
          <a
            href="/"
            className="py-3 px-6 rounded-xl border border-gray-800 bg-gray-900 text-gray-200 text-sm font-medium transition-all hover:border-gray-700 hover:bg-gray-800"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}