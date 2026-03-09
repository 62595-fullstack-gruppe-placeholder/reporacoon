"use client";
import { useEffect, useState } from "react";

export default function ConfirmEmailPendingPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel("email_confirmation");
    channel.onmessage = (e) => {
      if (e.data === "confirmed") {
        channel.close();
        window.location.href = "/dashboard";
      }
    };
    return () => channel.close();
  }, []);

  // Polling fallback — catches same-tab confirmation or different browser
  useEffect(() => {
    const poll = setInterval(async () => {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        clearInterval(poll);
        window.location.href = "/dashboard";
      }
    }, 3000);
    return () => clearInterval(poll);
  }, []);

  const handleResend = async () => {
    setLoading(true);
    const email = localStorage.getItem("pending_confirmation_email") ?? "";
    await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center max-w-md px-6">
        <div className="relative inline-block mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-200">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" />
            </svg>
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400" />
        </div>
        <h1 className="text-3xl font-semibold text-gray-100 mb-3 tracking-tight">
          Check your inbox
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-2">
          We sent a confirmation link to your email address.
        </p>
        <p className="text-gray-600 text-sm mb-10">
          This page will close automatically once confirmed{dots}
        </p>
        <button
          onClick={handleResend}
          disabled={loading || resent}
          className="w-full py-3 px-6 rounded-xl border border-gray-800 bg-gray-900 text-gray-200 text-sm font-medium transition-all hover:border-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {resent ? "✓ Email sent" : loading ? "Sending…" : "Resend confirmation email"}
        </button>
      </div>
    </main>
  );
}