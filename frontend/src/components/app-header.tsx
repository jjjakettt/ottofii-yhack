"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import {
  DEMO_BUSINESS_NAME,
  DEMO_ORG_ID,
  DEMO_USER_ID,
} from "@/lib/demo-account";
import { cn, initialsFromDisplayName } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recommendations", label: "Recommendations" },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return (
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname.startsWith("/actions")
    );
  }
  if (href === "/recommendations") {
    return pathname === "/recommendations" || pathname.startsWith("/recommendations/");
  }
  return pathname === href;
}

export function AppHeader() {
  const pathname = usePathname();
  const initials = initialsFromDisplayName(DEMO_BUSINESS_NAME);

  return (
    <header className="flex h-14 items-center border-b border-border px-6">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Ottofii</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ring-offset-background rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Account menu"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium leading-none">
                  {DEMO_BUSINESS_NAME}
                </span>
                <span className="text-muted-foreground text-xs">
                  Signed in (demo)
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="text-muted-foreground space-y-2 px-2 py-1.5 text-xs">
              <div className="flex items-start justify-between gap-3">
                <span className="shrink-0">Org ID</span>
                <span className="text-foreground font-mono text-[11px] leading-snug break-all text-right">
                  {DEMO_ORG_ID}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="shrink-0">User ID</span>
                <span className="text-foreground font-mono text-[11px] leading-snug break-all text-right">
                  {DEMO_USER_ID}
                </span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
