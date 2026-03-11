"use client";

import { User } from "@/lib/repository/user/userSchemas";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import AccountDropdown from "./AccountDropdown";

export default function Header({ user }: { user: User | null }) {
  const pathname = usePathname();

  return (
    <header data-testid="header">
      <div className="flex flex-row justify-between border-b border-box py-3 px-10 w-full items-center">
        <div id="header-left" className="flex flex-row items-center gap-4">
          <Link href="/">
            <Image src="/logo.png" alt="logo" width="32" height="32" />
          </Link>
          <p className="text-main-text text-2xl font-bold">Repo Racoon</p>
        </div>

        <div id="header-cont" className="w-1/2">
          <Links pathname={pathname} />
        </div>

        <div id="header-right">
          <AuthButtons user={user} />
        </div>
      </div>
    </header>
  );
}

type HeaderLinkItem = { href: string; label: string };

const publicHeaderItems: HeaderLinkItem[] = [
  {
    href: "/features",
    label: "Features",
  },
  {
    href: "/pricing",
    label: "Pricing",
  },
  {
    href: "/faq",
    label: "FAQ",
  },
  {
    href: "/legal",
    label: "Legal",
  },
];

const dashboardHeaderItems: HeaderLinkItem[] = [
  {
    href: "/dashboard",
    label: "My dashboard",
  },
  {
    href: "/dashboard/jobs",
    label: "Previous jobs",
  },
  {
    href: "/dashboard/recurring",
    label: "Recurring jobs",
  },
  {
    href: "/dashboard/rules",
    label: "Scan rules",
  },
  {
    href: "/dashboard/account",
    label: "My account",
  },
];

function Links({ pathname }: { pathname: string }) {
  const isDashboard = pathname.startsWith("/dashboard");
  const links = isDashboard ? dashboardHeaderItems : publicHeaderItems;
  return (
    <div className="flex flex-row items-center w-full justify-between">
      {links.map((link, index) => {
        const currentlySelected = pathname === link.href;
        return (
          <HeaderLink
            current={currentlySelected}
            key={`link-${index}`}
            href={link.href}
          >
            {link.label}
          </HeaderLink>
        );
      })}
    </div>
  );
}

function HeaderLink({
  href,
  children,
  current,
}: {
  href: string;
  children: string;
  current?: boolean;
}) {
  if (current === true) {
    return (
      <div className="text-xl underline underline-offset-4 text-foreground">
        <Link href={href}>{children}</Link>
      </div>
    );
  }
  return (
    <div className="text-xl hover:underline underline-offset-4">
      <Link href={href}>{children}</Link>
    </div>
  );
}

function AuthButtons({ user }: { user: User | null }) {
  if (user) {
    return (
      <div data-user-name="authed" data-testid="authbuttons">
        <AccountDropdown user={user} />
      </div>
    );
  }
  return (
    <div
      data-user-name="guest"
      data-testid="authbuttons"
      className="items-center inline-flex h-10 justify-end gap-8"
    >
      <button className="bg-button-main btn">
        <Link href="/signup">Sign up</Link>
      </button>
      <button className="bg-box px-5 btn">
        <Link href="/login">Log in</Link>
      </button>
    </div>
  );
}
