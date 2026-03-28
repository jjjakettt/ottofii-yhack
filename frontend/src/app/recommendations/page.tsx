"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  XCircle,
  MinusCircle,
  MessageSquare,
  ArrowRightLeft,
  AlertTriangle,
  Check,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { useConfirmAction, usePlan } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";
import type { ActionItem, SkippedStream } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const actionTypeConfig = {
  cancel: {
    icon: XCircle,
    label: "Cancel",
    className: "text-destructive",
  },
  downgrade: {
    icon: MinusCircle,
    label: "Downgrade",
    className: "text-warning",
  },
  negotiate: {
    icon: MessageSquare,
    label: "Negotiate",
    className: "text-primary",
  },
  switch: {
    icon: ArrowRightLeft,
    label: "Switch",
    className: "text-muted-foreground",
  },
};

const regretRiskConfig = {
  low: { label: "Low risk", className: "text-success" },
  medium: { label: "Medium risk", className: "text-warning" },
  high: { label: "High risk", className: "text-destructive" },
};

function RecommendationCard({
  recommendation,
  onApprove,
  onDismiss,
  isApproving,
}: {
  recommendation: ActionItem;
  onApprove: () => void;
  onDismiss: () => void;
  isApproving: boolean;
}) {
  const actionConfig = actionTypeConfig[recommendation.action_type];
  const ActionIcon = actionConfig.icon;
  const riskConfig = regretRiskConfig[recommendation.regret_risk];
  const ev = recommendation.evidence;
  const dupes = ev.duplicate_tools ?? [];

  return (
    <div className="border border-border bg-card">
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center border border-border bg-background",
              actionConfig.className
            )}
          >
            <ActionIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{recommendation.merchant}</span>
              <span
                className={cn(
                  "text-xs font-medium uppercase",
                  actionConfig.className
                )}
              >
                {actionConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className={riskConfig.className}>{riskConfig.label}</span>
              <span>
                Confidence:{" "}
                <span className="font-mono tabular-nums">
                  {(recommendation.confidence * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-semibold tabular-nums text-success">
            {formatCurrency(recommendation.monthly_savings_usd)}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(recommendation.annual_savings_usd)}/yr
          </div>
        </div>
      </div>

      <div className="border-b border-border p-4">
        <p className="text-sm text-foreground">{recommendation.explanation}</p>
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
              {ev.last_login_days_ago != null
                ? `${ev.last_login_days_ago} days ago`
                : "—"}
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
              {ev.benchmark_price_per_seat != null
                ? `$${ev.benchmark_price_per_seat}/seat`
                : "—"}
            </div>
          </div>
          {dupes.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="text-xs text-muted-foreground">Duplicate Tools</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {dupes.map((tool) => (
                  <span
                    key={tool}
                    className="border border-border bg-secondary px-2 py-0.5 text-xs"
                  >
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
                <span
                  key={source}
                  className="border border-border bg-background px-2 py-0.5 text-xs capitalize"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          disabled={isApproving}
          className="gap-1.5 text-muted-foreground"
        >
          <X className="h-4 w-4" />
          Dismiss
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          disabled={isApproving}
          className="gap-1.5"
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve
        </Button>
      </div>
    </div>
  );
}

function SkippedSection({ skipped }: { skipped: SkippedStream[] }) {
  if (skipped.length === 0) return null;

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          Skipped Subscriptions
        </div>
      </div>
      <div className="divide-y divide-border">
        {skipped.map((item) => (
          <div
            key={item.stream_id}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="font-medium">{item.merchant}</span>
            <span className="text-sm text-muted-foreground">{item.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const router = useRouter();
  const { plan, isLoading } = usePlan();
  const confirm = useConfirmAction();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const recommendations = useMemo(() => {
    const actions = plan?.actions ?? [];
    return actions.filter((a) => !dismissed.includes(a.recommendation_id));
  }, [plan, dismissed]);

  const skipped = plan?.skipped ?? [];
  const totalMonthlySavings = plan?.total_monthly_savings_usd ?? 0;
  const totalAnnualSavings = plan?.total_annual_savings_usd ?? 0;

  async function handleApprove(recommendationId: string) {
    setApprovingId(recommendationId);
    try {
      const result = await confirm.mutateAsync({ recommendationId });
      router.push(`/actions/${result.action_id}`);
    } catch {
      setApprovingId(null);
    }
  }

  function handleDismiss(recommendationId: string) {
    setDismissed((prev) => [...prev, recommendationId]);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Generating recommendations...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Recommendations
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-generated action plan to reduce your SaaS spend
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Total Savings Potential
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-success">
                {formatCurrency(totalMonthlySavings)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(totalAnnualSavings)} annually
              </div>
            </div>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.recommendation_id}
                  recommendation={rec}
                  onApprove={() => handleApprove(rec.recommendation_id)}
                  onDismiss={() => handleDismiss(rec.recommendation_id)}
                  isApproving={approvingId === rec.recommendation_id}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No recommendations remaining</p>
            </div>
          )}

          <SkippedSection skipped={skipped} />
        </div>
      </main>
    </div>
  );
}
