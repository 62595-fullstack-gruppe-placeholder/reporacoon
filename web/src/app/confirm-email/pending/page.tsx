"use client";
import { useEffect, useState } from "react";
import { Mail, Zap, ShieldCheck } from "lucide-react";

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
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 space-y-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="box border border-secondary/10 overflow-hidden shadow-xl bg-background/50 backdrop-blur-sm p-8 text-center">
          <div className="inline-flex p-4 bg-orange-500/10 border-2 border-orange-500/20 rounded-xl mb-6 relative">
            <Mail className="text-orange-400 mx-auto" size={48} />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500/20 border-2 border-orange-500/30 rounded-full animate-ping" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500/30 border-2 border-orange-500/40 rounded-full" />
          </div>

          <h1 className="h1 mb-4">Check your inbox</h1>

          <p className="text-secondary font-mono text-sm leading-relaxed mb-2">
            We sent a confirmation link to your email address. Once you've confirmed your email, you can safely close this page.
          </p>
          <p className="text-secondary font-mono text-sm mb-8">
            Awaiting confirmation{dots}
          </p>
        </div>

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={loading || resent}
          className="box w-full flex items-center justify-center gap-3 px-8 py-4 font-mono font-bold text-sm uppercase tracking-wider h-12
                     bg-orange-500/20 hover:bg-orange-500/30 border-2 border-orange-500/30 
                     hover:border-orange-500 text-orange-400 hover:text-orange-300 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          <Zap size={16} />
          {resent
            ? "✓ Email sent"
            : loading
              ? "Sending…"
              : "Resend confirmation email"}
        </button>

        {/* Dashboard Link */}
        <a
          href="/dashboard"
          className="box w-full flex items-center justify-center gap-3 px-8 py-4 font-mono font-bold text-sm uppercase tracking-wider h-12
                   bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 
                   text-secondary hover:text-text-main hover:shadow-lg transition-all mt-4"
        >
          <ShieldCheck size={16} />
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
