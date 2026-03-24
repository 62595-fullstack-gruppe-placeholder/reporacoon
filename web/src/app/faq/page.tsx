'use client';

import { useState } from 'react';
import { ChevronDown, ShieldQuestion } from 'lucide-react';

const faqs = [
  { 
    q: "How exactly does the raccoon find secrets?", 
    a: "We utilize high-entropy string detection and regex signatures to find API keys, tokens, and private keys across your entire commit history. Our 'sniffing' logic is updated weekly to catch new provider formats.",
    mono: "Algorithm"
  },
  { 
    q: "Is my repository data stored on your servers?", 
    a: "No. We process code in ephemeral environments. We only store the metadata (line numbers and file paths) required for your report. Your code never leaves the temporary scan instance.",
    mono: "Privacy"
  },
  { 
    q: "Which branches are scanned by default?", 
    a: "By default, we scan the default branch. Deep scans can be configured to merge findings across all active git branches, ensuring no credentials are leaked in staging or dev.",
    mono: "Coverage"
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>();

  return (
    <div className="flex flex-col items-center gap-12 py-20 px-4">
      {/* Header Section */}
      <div className="text-center max-w-2xl space-y-4">
        <h1 className="h1 text-4xl mb-4">Frequently Asked Questions</h1>
        <p className="p">Everything you need to know about Repo Raccoon security protocols.</p>
      </div>

      {/* FAQ Accordion List */}
      <div className="w-full max-w-4xl space-y-4">
        {faqs.map((faq, i) => (
          <div 
            key={i} 
            className="box border border-secondary/10 overflow-hidden shadow-xl transition-all hover:border-text-main/20"
          >
            {/* Question Header */}
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-text-main/5 transition-colors"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-button-main/20 rounded-lg">
                  <ShieldQuestion className="text-button-main" size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-secondary uppercase tracking-widest leading-none mb-1 block">
                    {faq.mono}
                  </span>
                  <h3 className="text-sm font-bold text-text-main">{faq.q}</h3>
                </div>
              </div>

              <div className={`transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                <ChevronDown size={24} className="text-secondary" />
              </div>
            </div>

            {openIndex === i && (
              <div className="border-t border-secondary/10 bg-text-main/5 p-8 animate-in fade-in slide-in-from-top-4">
                <div className="prose prose-invert max-w-none">
                  <p className="text-sm text-secondary font-mono leading-relaxed border-l-2 border-secondary/30 pl-6">
                    {faq.a}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}