'use client';

import { useState } from 'react';
import { Triangle, ChevronDown, MoreHorizontal } from 'lucide-react';
import { ScanFinding } from '../../lib/repository/scanFinding/scanFindingSchema';
import { getScanFindingByIdServerAction } from '../ScanServerActions';
import { ScanJob } from '@/lib/repository/scanJob/scanJobSchemas';


interface Props {
  findings: ScanFinding[] | null;
  job: ScanJob | null;
}

export default function ScanResults({ findings, job }: Props) {
  if (findings == null || job == null) {
    return
  }

  return (  
    <div className="w-full max-w-4xl mx-auto space-y-4 font-sans p-4">
      
      {/* OUTER CONTAINER: "Scanned for: [Platform]" */}
      <div className="border border-slate-300 rounded-md shadow-sm border border-green-200 bg-green-50 overflow-hidden">
          <h1 className="text-[20px] font-bold text-slate-1000">
            {job.repo_url}  
          </h1>
          <h3 className="text-[12px] font-bold text-slate-1000">
            Scanned for: {job.duration} s:  
          </h3>

        <div className="p-2 space-y-3">
          {findings.map((finding) => (
            <FindingItem key={finding.id} finding={finding} />
          ))}
        </div>

        {/* The decorative dashes/placeholders from bottom of sketch */}
        <div className="flex justify-center gap-8 py-4 opacity-20">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-6 h-1 bg-slate-400 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function FindingItem({ finding }: { finding: ScanFinding }) {
  const [isOpen, setIsOpen] = useState(true);

  // Helper to color-code based on your schema's severity
  const severityColors = {
    CRITICAL: "text-purple-600",
    HIGH: "text-red-600",
    MEDIUM: "text-orange-500",
    LOW: "text-blue-500",
  };

  return (
    <div className="box border border-slate-200 rounded-sm overflow-hidden">
      {/* NAME ROW: [Rule Name] | [Severity Stats] */}
      <div 
        className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-slate-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-bold text-slate-800 capitalize">
          {finding.rule.replace(/_/g, ' ')}
        </h3>
        
        <div className="flex items-center gap-3 font-mono font-bold">
          <span className={severityColors[finding.severity]}>1</span>
          <span className="text-slate-300">s</span>
          <span className="text-slate-400">10</span>
          <div className="flex items-center ml-2 text-slate-400">
            <Triangle size={12} className={`fill-current transition-transform ${isOpen ? 'rotate-180' : 'rotate-90'}`} />
          </div>
        </div>
      </div>

      {/* INNER BOX: file_path and rule indicator */}
      {isOpen && (
        <div className="mx-4 mb-4 border border-slate-300 bg-[#f8f9fa] p-4 font-mono text-sm relative">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-slate-900 font-bold border-b border-slate-400">
                file path: {finding.file_path}:{finding.line_number}</span>
            </div>

            {/* The Triangle Rule badge from sketch */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded shadow-sm">
              <Triangle size={10} className="fill-blue-600 text-blue-600" />
              <span className="text-[10px] font-bold text-slate-700 uppercase">rule</span>
            </div>
          </div>

          {/* Code Snippet Area (The "X8" section of sketch) */}
          <div className="bg-slate-900 text-emerald-400 p-3 rounded-sm overflow-x-auto">
            <span className="text-slate-500 mr-2">X8 :</span>
            <code>{finding.code_snippet}</code>
          </div>
        </div>
      )}
    </div>
  );
}