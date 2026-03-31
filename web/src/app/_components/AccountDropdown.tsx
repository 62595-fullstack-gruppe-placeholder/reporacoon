"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { User } from "@/lib/repository/user/userSchemas";
import { CircleUserRoundIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { logout } from "../_globalActions/logout";

type AccountDropdownProps = {
  user: User;
};

export default function AccountDropdown({ user }: AccountDropdownProps) {
  const [logoutLoading, setLogoutLoading] = useState<boolean>(false);

  const handleLogout = () => {
    setLogoutLoading(true);
    logout().then(() => {
      setLogoutLoading(false);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full">
          <CircleUserRoundIcon className="size-8" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-xs text-muted-foreground">You are logged in as</p>
          <p className="text-sm font-medium leading-none">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/account">My account</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">Settings</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleLogout();
          }}
        >
          <div className="flex w-full flex-row justify-between text-red-500">
            {logoutLoading ? <p>Logging out...</p> : <p>Log out</p>}
            {logoutLoading ? (
              <Spinner />
            ) : (
              <LogOutIcon className="text-red-500" />
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
