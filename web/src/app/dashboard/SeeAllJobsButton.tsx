"use client";

import Link from "next/link";
import { List } from "lucide-react";

export function SeeAllJobsButton() {
  return (
    <Link
      href="/dashboard/jobs"
      className="flex items-center gap-2 px-4 py-2 font-mono font-bold text-sm uppercase tracking-wider bg-button-main/20 hover:bg-button-main/30 border border-button-main/30 hover:border-button-main text-button-main hover:shadow-lg transition-all rounded-lg"
    >
      <List size={16} />
      See all previous jobs
    </Link>
  );
}
