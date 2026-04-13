'use client';

import { Check, Terminal, ShieldCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const tiers = [
  {
    name: "Scout",
    mono: "Tier 01",
    price: "Free",
    description: "Perfect for individual developers and public projects.",
    features: ["Public Repo Scans", "Critical & High Findings", "Community Support"],
    icon: <Terminal className="text-secondary" size={24} />,
    buttonText: "Start Scanning",
    highlight: false
  },
  {
    name: "Guardian",
    mono: "Tier 02",
    price: "$19",
    description: "Enhanced protection for professional devs and small teams.",
    features: ["Private Repo Support", "Multi-Branch Analysis", "Deep Scan Logic", "Priority Email Support", "Slack Integration"],
    icon: <ShieldCheck className="text-button-main" size={24} />,
    buttonText: "Get Started",
    highlight: true
  },
  {
    name: "Apex",
    mono: "Tier 03",
    price: "$49",
    description: "Full-scale security infrastructure for growing startups.",
    features: ["Unlimited Private Repos", "Automated Weekly Reviews", "Custom Regex Rules", "Dedicated Racoon instance", "24/7 Priority Support"],
    icon: <ShieldAlert className="text-orange-400" size={24} />,
    buttonText: "Go Apex",
    highlight: false
  }
];

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center gap-16 py-20 px-4">
      {/* Header */}
      <div className="text-center max-w-2xl space-y-4">
        <h1 className="h1 text-4xl">Subscribe for extra features</h1>
        <p className="p text-lg">Choose the level of protection your code deserves.</p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
        {tiers.map((tier, i) => (
          <div 
            key={i} 
            className={`box border overflow-hidden shadow-xl p-8 flex flex-col transition-all hover:border-text-main/20 ${
              tier.highlight ? 'border-button-main/50 ring-1 ring-button-main/20' : 'border-secondary/10'
            }`}
          >
            {/* Tier Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-button-main/20 rounded-lg">
                {tier.icon}
              </div>
              <div>
                <span className="text-[10px] font-mono text-secondary uppercase tracking-widest leading-none mb-1 block">
                  {tier.mono}
                </span>
                <h2 className="text-xl font-black text-text-main">{tier.name}</h2>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6 border-b border-secondary/10 pb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-text-main">{tier.price}</span>
                {tier.price !== "Free" && <span className="text-secondary font-mono text-sm">/mo</span>}
              </div>
              <p className="text-sm text-secondary mt-2 min-h-[40px]">{tier.description}</p>
            </div>

            {/* Features List */}
            <ul className="space-y-4 mb-8 flex-grow">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-secondary font-mono">
                  <Check size={14} className="text-button-main shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link 
              href={tier.price === "Free" ? "/" : "/signup"} 
              className={`btn gap-2 transition-all group font-bold text-sm w-full h-12 ${
                tier.highlight 
                  ? 'bg-button-main text-white hover:opacity-90' 
                  : 'bg-button-main/10 border border-button-main/30 text-button-main hover:bg-button-main/20'
              }`}
            >
              <span>{tier.buttonText}</span>
              <Image 
                src="/logo.png" 
                alt="Repo Raccoon Logo" 
                width={16} 
                height={16} 
                className={`group-hover:animate-bounce ${tier.highlight ? 'invert' : ''}`} 
              />
            </Link>
          </div>
        ))}
        <p className="p text-secondary">*Not actually a paid service</p>
      </div>
    </div>
  );
}