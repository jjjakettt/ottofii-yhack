"use client";

import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

export type AppLoadingProps = {
  /** Shown below the spinner (e.g. “Generating recommendations…”). */
  message?: string;
  className?: string;
};

export function AppLoading({ message, className }: AppLoadingProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background", className)}>
      <AppHeader />
      <main
        className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12"
        role="status"
        aria-busy="true"
        aria-label={message ?? "Loading"}
      >
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-10 py-12 shadow-sm">
          <Loader2
            className="h-10 w-10 animate-spin text-primary"
            aria-hidden
          />
          {message ? (
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              {message}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
