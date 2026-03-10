"use client";

import { User } from "@/lib/repository/user/userSchemas";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import AccountDropdown from "./AccountDropdown";

export default function Header({ user }: { user: User | null }) {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <header>
      <div className="flex flex-row justify-between border-b border-box py-3 px-10 w-full items-center">
        <div id="header-left" className="flex flex-row items-center gap-4">
          <Link href="/">
            <Image src="/logo.png" alt="logo" width="32" height="32" />
          </Link>
          <p className="text-main-text text-2xl font-bold">Repo Racoon</p>
        </div>

        <div id="header-cont" className="w-1/2">
          <Links isDashboard={isDashboard} />
        </div>

        <div id="header-right">
          <AuthButtons user={user} />
        </div>
      </div>
    </header>
  );
}

function Links({ isDashboard }: { isDashboard: boolean }) {
  return (
    <div className="flex flex-row items-center w-full justify-between">
      {isDashboard ? (
        <>
          <HeaderLink href="">Previous jobs</HeaderLink>
          <HeaderLink href="">Recurring jobs</HeaderLink>
          <HeaderLink href="">Scan rules</HeaderLink>
          <HeaderLink href="">My account</HeaderLink>
        </>
      ) : (
        <>
          <HeaderLink href="">Features</HeaderLink>
          <HeaderLink href="">Pricing</HeaderLink>
          <HeaderLink href="">FAQ</HeaderLink>
          <HeaderLink href="">Legal</HeaderLink>
        </>
      )}
    </div>
  );
}

function HeaderLink({ href, children }: { href: string; children: string }) {
  return (
    <div className="text-xl hover:underline underline-offset-4">
      <Link href={href}>{children}</Link>
    </div>
  );
}

function AuthButtons({ user }: { user: User | null }) {
  if (user) {
    return (
      <div className="">
        <AccountDropdown user={user} />
      </div>
    );
  }
  return (
    <div className="items-center inline-flex h-10 justify-end gap-8">
      <button className="bg-button-main btn">
        <Link href="/signup">Sign up</Link>
      </button>
      <button className="bg-box px-5 btn">
        <Link href="/login">Log in</Link>
      </button>
    </div>
  );
}
