"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recommendations", label: "Recommendations" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center border-b border-border px-6">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Ottofii</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 text-sm transition-colors",
                pathname === item.href ||
                  (item.href === "/dashboard" && pathname.startsWith("/actions"))
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <span className="text-sm text-muted-foreground">user_demo</span>
      </div>
    </header>
  );
}
