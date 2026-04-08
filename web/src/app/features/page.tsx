'use client';

import { ShieldCheck, GitBranch, Search, AlertTriangle, Terminal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    title: "Secret Detection",
    description: "Our racoon sniffs out hardcoded API keys, database credentials, and SSH keys before hackers do.",
    icon: <ShieldCheck className="text-button-main" size={24} />,
    mono: "Protection"
  },
  {
    title: "Deep Scan Logic",
    description: "Using advanced pattern matching to scan public repos in seconds, not minutes.",
    icon: <Search className="text-orange-400" size={24} />, 
    mono: "Proprietary"
  },
  {
    title: "Multi-Branch Analysis",
    description: "Identify vulnerabilities across main, staging, and dev branches simultaneously.",
    icon: <GitBranch className="text-white" size={24} />,
    mono: "Coverage"
  },
  {
    title: "Detailed Snippets",
    description: "View the exact line and code context of every leak in a secure, high-contrast viewer.",
    icon: <Terminal className="text-emerald-400" size={24} />,
    mono: "Analysis"
  }
];

export default function Features() {
  return (
    <div className="flex flex-col items-center gap-16 py-20 px-4">
      {/* Header Section */}
      <div className="text-center max-w-2xl space-y-4">
        <h1 className="h1 text-4xl">More than just a scan</h1>
        <p className="p">Advanced security forensics for modern development teams.</p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
        {features.map((f, i) => (
          <div 
            key={i} 
            className="box border border-secondary/10 overflow-hidden shadow-xl p-8 flex flex-col gap-4 transition-all hover:border-white/20"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-button-main/20 rounded-lg">
                {f.icon}
              </div>
              <div>
                <span className="text-[10px] font-mono text-secondary uppercase tracking-widest leading-none mb-1 block">
                  {f.mono}
                </span>
                <h2 className="text-lg font-black text-text-main">{f.title}</h2>
              </div>
            </div>
            <p className="p text-left leading-relaxed border-t border-secondary/10 pt-4">
              {f.description}
            </p>
          </div>
        ))}
      </div>

      <Link 
        href="/" 
        className="box flex items-center justify-center gap-2 px-8 py-4 bg-button-main/10 border border-button-main/30 hover:bg-button-main/20 transition-all group w-max"
      >
        <span className="text-sm font-black text-button-main">Initialize First Scan</span>
        <Image 
          src="/logo.png" 
          alt="Logo" 
          width={16} 
          height={16} 
          className="group-hover:animate-bounce" 
        />
      </Link>
    </div>
  );
}