"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  Play,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppHeader } from "@/components/app-header";
import { connectSource, connectSources } from "@/apis/connect";
import type { Source } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { savingsSummaryKey, streamsKey } from "@/hooks/keys";
import { cn } from "@/lib/utils";

interface SourceOption {
  id: Source;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const MULTI_SELECT_SOURCES = ["bank", "gmail", "slack", "csv"] as const satisfies readonly Source[];

const sources: SourceOption[] = [
  {
    id: "bank",
    name: "Bank / Cards",
    description: "Connect via Plaid to detect recurring charges",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Scan receipts and subscription emails",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Analyze app integrations and usage patterns",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    id: "csv",
    name: "CSV Upload",
    description: "Import your own expense data",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
];

export default function DashboardConnectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addConnectedSources } = useAppContext();
  const [selected, setSelected] = useState<Set<Source>>(() => new Set());
  const [connecting, setConnecting] = useState<"multi" | Source | null>(null);

  function toggleSource(source: Source) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }

  async function handleConnectSelected() {
    const list = MULTI_SELECT_SOURCES.filter((s) => selected.has(s));
    if (list.length === 0) return;
    setConnecting("multi");
    try {
      await connectSources(list);
      addConnectedSources(list);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: streamsKey() }),
        queryClient.invalidateQueries({ queryKey: savingsSummaryKey() }),
      ]);
      router.push("/dashboard");
    } catch {
      setConnecting(null);
    }
  }

  async function handleConnect(source: Source) {
    setConnecting(source);
    try {
      await connectSource(source);
      addConnectedSources([source]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: streamsKey() }),
        queryClient.invalidateQueries({ queryKey: savingsSummaryKey() }),
      ]);
      router.push("/dashboard");
    } catch {
      setConnecting(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex flex-1 flex-col px-4 py-10">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Connect your data
            </h1>
            <p className="mt-2 text-muted-foreground">
              Select one or more sources, then connect to start detecting wasted SaaS
              spend
            </p>
          </div>

          <div className="space-y-3">
            {sources.map((source) => {
              const isSelected = selected.has(source.id);
              const busy = connecting !== null;
              return (
                <div
                  key={source.id}
                  role="button"
                  tabIndex={busy ? -1 : 0}
                  onClick={() => !busy && toggleSource(source.id)}
                  onKeyDown={(e) => {
                    if (busy) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSource(source.id);
                    }
                  }}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-4 border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary",
                    busy && "cursor-not-allowed opacity-50",
                    isSelected && "border-primary/60 bg-secondary/80"
                  )}
                >
                  <span
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => !busy && toggleSource(source.id)}
                      disabled={busy}
                      className="shrink-0"
                      aria-label={`Select ${source.name}`}
                    />
                  </span>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background text-muted-foreground group-hover:border-primary/50 group-hover:text-primary">
                    {source.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{source.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {source.description}
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    <ArrowRight
                      className={cn(
                        "h-4 w-4 transition-opacity",
                        isSelected
                          ? "opacity-100 text-primary"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <Button
              className="w-full gap-2"
              onClick={handleConnectSelected}
              disabled={connecting !== null || selected.size === 0}
            >
              {connecting === "multi" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Connect{" "}
              {selected.size === 0
                ? "selected sources"
                : `${selected.size} source${selected.size === 1 ? "" : "s"}`}
            </Button>
          </div>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => handleConnect("demo")}
            disabled={connecting !== null}
          >
            {connecting === "demo" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Try demo mode
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Demo mode loads sample data so you can explore without connecting real
            accounts
          </p>
        </div>
      </main>
    </div>
  );
}
