"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyLinkButtonProps {
  link?: string;
  label?: string;
}
export function CopyLinkButton({
  link,
  label = "Copy link",
}: CopyLinkButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion toggle
    await navigator.clipboard.writeText(link ?? window.location.href);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-secondary hover:text-text-main h-9 min-w-[100px] group hover:shadow-lg"
    >
      {isCopied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400 group-hover:text-emerald-300" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-secondary/70 group-hover:text-text-main" />
      )}
      <span className="font-mono tracking-wider uppercase">
        {isCopied ? "Copied!" : label}
      </span>
    </button>
  );
}
