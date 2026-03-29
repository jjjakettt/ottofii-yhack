"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  XCircle,
  MinusCircle,
  MessageSquare,
  ArrowRightLeft,
  Info,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { AppLoading } from "@/components/app-loading";
import { usePlan, useConfirmAction } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const actionTypeConfig = {
  cancel: { icon: XCircle, label: "Cancel", className: "text-destructive" },
  downgrade: { icon: MinusCircle, label: "Downgrade", className: "text-warning" },
  negotiate: { icon: MessageSquare, label: "Negotiate", className: "text-primary" },
  switch: { icon: ArrowRightLeft, label: "Switch", className: "text-muted-foreground" },
};

const regretRiskConfig = {
  low: { label: "Low risk", className: "text-success" },
  medium: { label: "Medium risk", className: "text-warning" },
  high: { label: "High risk", className: "text-destructive" },
};

function RecommendationCard({
  action,
  onApprove,
  isApproving,
}: {
  action: ActionItem;
  onApprove: () => void;
  isApproving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const actionConfig = actionTypeConfig[action.action_type];
  const ActionIcon = actionConfig.icon;
  const riskConfig = regretRiskConfig[action.regret_risk];
  const ev = action.evidence;
  const dupes = ev.duplicate_tools ?? [];

  return (
    <div className="border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40",
          expanded && "border-b border-border"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background",
              actionConfig.className
            )}
          >
            <ActionIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{action.merchant}</span>
              <span className={cn("text-xs font-medium uppercase", actionConfig.className)}>
                {actionConfig.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span className={riskConfig.className}>{riskConfig.label}</span>
              <span>
                Confidence:{" "}
                <span className="font-mono tabular-nums">
                  {(action.confidence * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <div className="text-right">
            <div className="font-mono text-xl font-semibold tabular-nums text-success">
              {formatCurrency(action.monthly_savings_usd)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(action.annual_savings_usd)}/yr
            </div>
          </div>
          <ChevronDown
            className={cn(
              "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180"
            )}
            aria-hidden
          />
        </div>
      </button>

      {expanded && (
        <>
          <div className="border-b border-border p-4">
            <p className="text-sm text-foreground">{action.explanation}</p>
          </div>

          <div className="border-b border-border p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Info className="h-3 w-3" />
              Evidence
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-xs text-muted-foreground">Last Login</div>
                <div className="font-mono text-sm tabular-nums">
                  {ev.last_login_days_ago != null ? `${ev.last_login_days_ago} days ago` : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Active Seats</div>
                <div className="font-mono text-sm tabular-nums">
                  {ev.active_seat_count ?? "—"} / {ev.total_seat_count ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Benchmark Price</div>
                <div className="font-mono text-sm tabular-nums">
                  {ev.benchmark_price_per_seat != null ? `$${ev.benchmark_price_per_seat}/seat` : "—"}
                </div>
              </div>
              {dupes.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="text-xs text-muted-foreground">Duplicate Tools</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dupes.map((tool) => (
                      <span key={tool} className="border border-border bg-secondary px-2 py-0.5 text-xs">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">Data Sources</div>
                <div className="mt-1 flex gap-1">
                  {ev.sources.map((source) => (
                    <span key={source} className="border border-border bg-background px-2 py-0.5 text-xs capitalize">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4">
            <Button size="sm" onClick={onApprove} disabled={isApproving} className="gap-1.5">
              {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const router = useRouter();
  const { plan, isLoading, isFetching } = usePlan();
  const confirm = useConfirmAction();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function handleApprove(recommendationId: string) {
    setApprovingId(recommendationId);
    try {
      const result = await confirm.mutateAsync({ recommendationId });
      router.push(`/actions/${result.action_id}`);
    } catch {
      setApprovingId(null);
    }
  }

  if (isLoading) {
    return <AppLoading message="Generating recommendations…" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      {isFetching && plan && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Refreshing recommendations…
        </div>
      )}

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Recommendations</h1>
              <p className="text-sm text-muted-foreground">
                AI-generated actions to reduce your SaaS spend
              </p>
            </div>
            {plan && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Savings Potential</div>
                <div className="font-mono text-2xl font-semibold tabular-nums text-success">
                  {formatCurrency(plan.total_monthly_savings_usd)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(plan.total_annual_savings_usd)} annually
                </div>
              </div>
            )}
          </div>

          {plan && plan.actions.length > 0 ? (
            <div className="space-y-4">
              {plan.actions.map((action) => (
                <RecommendationCard
                  key={action.recommendation_id}
                  action={action}
                  onApprove={() => handleApprove(action.recommendation_id)}
                  isApproving={approvingId === action.recommendation_id}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No recommendations found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
