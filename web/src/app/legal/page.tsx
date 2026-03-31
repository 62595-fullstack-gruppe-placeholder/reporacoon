'use client';

import { useState } from 'react';
import { ChevronDown, ShieldAlert, Scale, Lock, FileText } from 'lucide-react';

const legalSections = [
  {
    title: "Terms of Service",
    icon: <Scale className="text-button-main" size={24} />,
    content: "By using Repo Raccoon, you agree to allow our 'raccoon' to index and analyze the repositories you provide. You are responsible for the code you scan and ensure you have the rights to perform security analysis on said repositories."
  },
  {
    title: "Privacy Policy",
    icon: <Lock className="text-text-main" size={24} />, // Updated to use theme variable
    content: "We process repository data in ephemeral environments. We do not store your source code. We only retain metadata (finding types, file paths, and line numbers) required to generate your security reports."
  },
  {
    title: "Responsible Disclosure",
    icon: <ShieldAlert className="text-orange-400" size={24} />,
    content: "Repo Raccoon is a defensive tool. Using this tool to identify vulnerabilities in third-party systems without explicit permission is strictly prohibited. Play nice, protect the ecosystem."
  },
  {
    title: "Cookie Policy",
    icon: <FileText className="text-emerald-400" size={24} />,
    content: "We use essential cookies for authentication and session management. No third-party tracking cookies are deployed. Your session is secured via encrypted HTTP-only cookies."
  }
];

export default function LegalPage() {
  const [openIndex, setOpenIndex] = useState<number | null>();

  return (
    <div className="flex flex-col items-center gap-12 py-20 px-4">
      {/* Header Section */}
      <div className="text-center max-w-2xl space-y-4">
        <h1 className="h1 text-4xl">Legal</h1>
        <p className="p">Transparent documentation regarding our security standards and service usage.</p>
      </div>

      {/* Accordion List */}
      <div className="w-full max-w-4xl space-y-4">
        {legalSections.map((section, i) => (
          <div 
            key={i} 
            className="box border border-secondary/10 overflow-hidden shadow-xl transition-all hover:border-text-main/20"
          >
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-text-main/5 transition-colors"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-button-main/20 rounded-lg">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-lg font-black text-text-main">{section.title}</h2>
                </div>
              </div>
              <ChevronDown 
                size={24} 
                className={`text-secondary transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} 
              />
            </div>

            {openIndex === i && (
              <div className="border-t border-secondary/10 bg-background/50 p-8 animate-in fade-in slide-in-from-top-4">
                <div className="prose prose-invert max-w-none">
                  <p className="text-sm text-secondary font-mono leading-relaxed border-l-2 border-secondary/30 pl-6">
                    {section.content}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="p text-xs mt-8">
        Last updated: March 16, 2026. For specific legal inquiries, contact 
        <span className="text-button-main ml-1 font-bold">legal@reporaccoon.com</span>
      </p>
    </div>
  );
}