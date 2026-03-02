'use client';

import { useState } from 'react';
import { ChevronDown, ShieldCheck, Zap, List, AlertTriangle, CircleDashed } from 'lucide-react';
import { ScanFinding } from '../../lib/repository/scanFinding/scanFindingSchema';
import { ScanJob } from '@/lib/repository/scanJob/scanJobSchemas';

interface Props {
  findings: ScanFinding[] | null;
  job: ScanJob | null;
}

export default function ScanResults({ findings, job }: Props) {
  const [isMainOpen, setIsMainOpen] = useState(true);

  if (!findings || !job) return null;

  return (
    <div className="w-full transition-all duration-300">
      <div className="box border border-secondary/10 overflow-hidden shadow-xl">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsMainOpen(!isMainOpen)}
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-button-main/20 rounded-lg">
              <ShieldCheck className="text-button-main" size={24} />
            </div>
            <div>
              <h2 className="text-xs font-mono text-secondary uppercase tracking-widest">Security Report</h2>
              <h1 className="text-xl font-black text-text-main truncate max-w-[200px] md:max-w-md lg:max-w-full">
                {job.repo_url.split('/').slice(-2).join('/')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex items-center gap-4 border-r border-secondary/20 pr-6 mr-2">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-secondary">Duration</span>
                <div className="flex items-center gap-1.5 text-sm font-mono text-text-main">
                   <Zap size={12} className="text-orange-400" />
                   <span>{job.duration || 0}s</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-secondary">Status</span>
                <div className="flex items-center gap-1.5 text-sm font-mono text-button-main font-bold">
                   <span className="capitalize">{job.status}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-secondary">Findings</span>
                <div className="flex items-center gap-1.5 text-sm font-mono text-red-500 font-bold">
                   <AlertTriangle size={12} />
                   <span>{findings.length}</span>
                </div>
              </div>
            </div>

            <div className={`transition-transform duration-300 ${isMainOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={24} className="text-secondary" />
            </div>
          </div>
        </div>

        {isMainOpen && (
          <div className="border-t border-secondary/10 bg-background/50 p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <List size={16} />
              <span className="text-xs font-bold uppercase tracking-tighter">Detailed Analysis</span>
            </div>
            
            <div className="space-y-3">
              {findings.map((finding) => (
                <FindingItem key={finding.id} finding={finding} />
              ))}
              
              {findings.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-secondary/10 rounded-xl">
                  <p className="text-secondary font-mono text-sm">No vulnerabilities detected in this scan. Good job! 🦝</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FindingItem({ finding }: { finding: ScanFinding }) {
  const [isOpen, setIsOpen] = useState(false);

  const severityMap = {
    CRITICAL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    HIGH: "bg-red-500/10 text-red-400 border-red-500/20",
    MEDIUM: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    LOW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="bg-background/40 border border-white/5 rounded-xl overflow-hidden transition-all hover:border-white/20">
      <div 
        className="flex justify-between items-center px-4 py-3 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityMap[finding.severity as keyof typeof severityMap]}`}>
            {finding.severity}
          </span>
          <h3 className="text-sm font-bold text-text-main truncate max-w-[200px] md:max-w-md">
            {finding.rule.replace(/_/g, ' ')}
          </h3>
        </div>
        <ChevronDown size={16} className={`text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="px-4 pb-4">
          <div className="text-[11px] font-mono text-secondary mb-2 border-l-2 border-secondary/30 pl-2">
            {finding.file_path}:{finding.line_number}
          </div>
          <div className="bg-[#0d1117] text-emerald-400 p-3 rounded-lg text-xs font-mono border border-white/5 overflow-x-auto">
            <code>{finding.code_snippet}</code>
          </div>
        </div>
      )}
    </div>
  );
}