"use client";

import Link from "next/link";
import {
  ArrowRight,
  Plus,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { useStreams } from "@/hooks/useStreams";
import { useSavingsSummary } from "@/hooks/useAction";
import { cn } from "@/lib/utils";
import type { RecurringStream, UsageSignal } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function UsageIndicator({ signal }: { signal: UsageSignal }) {
  const config: Record<
    "active" | "low" | "none",
    { label: string; className: string }
  > = {
    active: { label: "Active", className: "bg-success/20 text-success" },
    low: { label: "Low", className: "bg-warning/20 text-warning" },
    none: { label: "None", className: "bg-destructive/20 text-destructive" },
  };
  const key =
    signal === "active" || signal === "low" || signal === "none"
      ? signal
      : "none";
  const { label, className } = config[key];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 bg-secondary">
        <div
          className="h-full bg-primary"
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span className="font-mono text-xs text-muted-foreground">
        {(confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { streams: streamsPayload, isLoading: streamsLoading } = useStreams();
  const { summary, isLoading: savingsLoading } = useSavingsSummary();

  const loading = streamsLoading || savingsLoading;
  const streams: RecurringStream[] = streamsPayload?.streams ?? [];
  const totalMonthly = streamsPayload?.total_monthly_usd ?? 0;
  const streamCount = streamsPayload?.stream_count ?? 0;
  const savings = summary;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Your detected subscriptions and spend overview
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild className="gap-2">
                <Link href="/dashboard/connect">
                  <Plus className="h-4 w-4" />
                  Add Source
                </Link>
              </Button>
              <Button asChild className="gap-2">
                <Link href="/recommendations">
                  View Recommendations
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total Monthly Spend</div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {formatCurrency(totalMonthly)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {streamCount} subscriptions detected
              </div>
            </div>

            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5 text-success" />
                Verified Savings
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-success">
                {formatCurrency(savings?.verified_monthly_usd || 0)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatCurrency(savings?.verified_annual_usd || 0)} annually
              </div>
            </div>

            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-warning" />
                Pending Savings
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {formatCurrency(savings?.pending_monthly_usd || 0)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Awaiting execution</div>
            </div>

            <div className="border border-border bg-card p-4">
              <div className="text-sm text-muted-foreground">Actions</div>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-mono text-sm tabular-nums">
                    {savings?.actions_succeeded || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="font-mono text-sm tabular-nums">
                    {savings?.actions_pending || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-mono text-sm tabular-nums">
                    {savings?.actions_failed || 0}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Succeeded / Pending / Failed
              </div>
            </div>
          </div>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-medium">Detected Subscriptions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Merchant</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Cadence</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Seats</th>
                    <th className="px-4 py-3 font-medium">Usage</th>
                    <th className="px-4 py-3 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {streams.map((stream) => (
                    <tr
                      key={stream.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stream.merchant}</span>
                          {stream.is_protected && (
                            <span className="text-xs text-muted-foreground">
                              Protected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-muted-foreground">
                        {stream.category}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-muted-foreground">
                        {stream.cadence}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm tabular-nums">
                          {formatCurrency(stream.amount_usd)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm tabular-nums text-muted-foreground">
                          {stream.seat_count ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <UsageIndicator signal={stream.usage_signal} />
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBar confidence={stream.confidence} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
