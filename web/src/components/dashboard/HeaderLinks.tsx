"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardHeaderLinks() {
  const pathname = usePathname();

  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <div className="mx-4">
      <div className="flex flex-row justify-between">
        <Link href="">link1</Link>
        <Link href="">link2</Link>
        <Link href="">link3</Link>
        <Link href="">link4</Link>
      </div>
    </div>
  );
}
