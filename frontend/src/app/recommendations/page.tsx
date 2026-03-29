"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  ShieldCheck,
  ShieldAlert,
  Shield,
  X,
  CheckCircle2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppHeader } from "@/components/app-header";
import { AppLoading } from "@/components/app-loading";
import {
  useRecommendations,
  useConfirmAction,
  useRejectAction,
  useGeneratePlan,
} from "@/hooks/usePlan";
import { executeAction } from "@/apis/agent";
import { cn } from "@/lib/utils";
import type { RecommendationItem, RecommendationStatus, RegretRisk, ActionType } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const actionTypeConfig: Record<
  ActionType,
  { icon: React.ElementType; label: string; bgClassName: string; textClassName: string }
> = {
  cancel: {
    icon: XCircle,
    label: "Cancel",
    bgClassName: "bg-destructive/10 border-destructive/20",
    textClassName: "text-destructive",
  },
  downgrade: {
    icon: MinusCircle,
    label: "Downgrade",
    bgClassName: "bg-warning/10 border-warning/20",
    textClassName: "text-warning",
  },
  negotiate: {
    icon: MessageSquare,
    label: "Negotiate",
    bgClassName: "bg-primary/10 border-primary/20",
    textClassName: "text-primary",
  },
  switch: {
    icon: ArrowRightLeft,
    label: "Switch",
    bgClassName: "bg-muted border-border",
    textClassName: "text-muted-foreground",
  },
};

const regretRiskConfig: Record<
  RegretRisk,
  { label: string; icon: React.ElementType; textClassName: string; bgClassName: string }
> = {
  low: {
    label: "Low risk",
    icon: ShieldCheck,
    textClassName: "text-success",
    bgClassName: "bg-success/10 border-success/20",
  },
  medium: {
    label: "Medium risk",
    icon: Shield,
    textClassName: "text-warning",
    bgClassName: "bg-warning/10 border-warning/20",
  },
  high: {
    label: "High risk",
    icon: ShieldAlert,
    textClassName: "text-destructive",
    bgClassName: "bg-destructive/10 border-destructive/20",
  },
};

const statusBadgeConfig: Partial<
  Record<RecommendationStatus, { icon: React.ElementType; label: string; bgClassName: string; textClassName: string }>
> = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    bgClassName: "bg-success/10 border-success/20",
    textClassName: "text-success",
  },
  rejected: {
    icon: X,
    label: "Rejected",
    bgClassName: "bg-destructive/10 border-destructive/20",
    textClassName: "text-destructive",
  },
};

function ActionTypeBadge({ type }: { type: ActionType }) {
  const cfg = actionTypeConfig[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-medium",
        cfg.bgClassName,
        cfg.textClassName
      )}
    >
      <span className="text-muted-foreground font-normal">Action:</span>
      {cfg.label}
    </span>
  );
}

function RiskBadge({ risk }: { risk: RegretRisk }) {
  const cfg = regretRiskConfig[risk];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-medium",
        cfg.bgClassName,
        cfg.textClassName
      )}
    >
      <span className="text-muted-foreground font-normal">Regret risk:</span>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: RecommendationStatus }) {
  const cfg = statusBadgeConfig[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-medium",
        cfg.bgClassName,
        cfg.textClassName
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function RecommendationCard({
  action,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  showActions,
  bulkBusy = false,
  selection,
}: {
  action: RecommendationItem;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
  showActions: boolean;
  bulkBusy?: boolean;
  selection?: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const ev = action.evidence;
  const dupes = ev.duplicate_tools ?? [];

  return (
    <div className={cn("border border-border bg-card", action.status === "rejected" && "opacity-60")}>
      <div
        className={cn(
          "flex w-full items-stretch",
          expanded && "border-b border-border"
        )}
      >
        {selection && (
          <div
            className="flex shrink-0 items-start pt-4 pl-3"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selection.checked}
              disabled={selection.disabled}
              onCheckedChange={(v) => selection.onCheckedChange(v === true)}
              aria-label={`Select ${action.merchant}`}
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40"
        >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{action.merchant}</span>
              <ActionTypeBadge type={action.action_type} />
              <RiskBadge risk={action.regret_risk} />
              {action.status !== "pending" && <StatusBadge status={action.status} />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
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
            <div className={cn("font-mono text-xl font-semibold tabular-nums", action.status === "rejected" ? "text-muted-foreground line-through" : "text-success")}>
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
      </div>

      {action.status !== "pending" &&
        (action.action_id || action.result_confirmation_id) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-muted/15 px-4 py-2.5 text-xs">
            <span className="font-semibold uppercase tracking-wide text-muted-foreground">
              Action result
            </span>
            {action.result_confirmation_id && (
              <span className="text-muted-foreground">
                Confirmation{" "}
                <span className="font-mono text-foreground">{action.result_confirmation_id}</span>
              </span>
            )}
            {action.action_id && (
              <Link
                href={`/actions/${action.action_id}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                View execution details
              </Link>
            )}
          </div>
        )}

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

          {showActions && (
            <div className="flex items-center justify-end gap-2 p-4">
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={isRejecting || isApproving || bulkBusy}
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Reject
              </Button>
              <Button
                size="sm"
                onClick={onApprove}
                disabled={isApproving || isRejecting || bulkBusy}
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
          )}
        </>
      )}
    </div>
  );
}

type Tab = "pending" | "done";

const RISK_DOT: Record<RegretRisk, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-destructive",
};

export default function RecommendationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [riskFilter, setRiskFilter] = useState<RegretRisk | "all">("all");
  const [actionTypeFilter, setActionTypeFilter] = useState<ActionType | "all">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState<"approve" | "reject" | null>(null);

  const { recommendations, totalMonthlySavings, totalAnnualSavings, isLoading } =
    useRecommendations(tab === "pending" ? "pending" : "done");

  const confirm = useConfirmAction();
  const reject = useRejectAction();
  const generatePlan = useGeneratePlan();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return recommendations.filter((r) => {
      if (riskFilter !== "all" && r.regret_risk !== riskFilter) return false;
      if (actionTypeFilter !== "all" && r.action_type !== actionTypeFilter) return false;
      return true;
    });
  }, [recommendations, riskFilter, actionTypeFilter]);

  const pendingSelectableIds = useMemo(
    () => filtered.filter((r) => r.status === "pending").map((r) => r.recommendation_id),
    [filtered]
  );

  const selectedPendingIds = useMemo(
    () => selectedIds.filter((id) => pendingSelectableIds.includes(id)),
    [selectedIds, pendingSelectableIds]
  );

  useEffect(() => {
    if (tab !== "pending") setSelectedIds([]);
  }, [tab]);

  const allPendingSelected =
    pendingSelectableIds.length > 0 && selectedPendingIds.length === pendingSelectableIds.length;
  const bulkBusy = bulkMode !== null;

  async function handleApprove(recommendationId: string) {
    setApprovingId(recommendationId);
    try {
      const { action_id } = await confirm.mutateAsync({ recommendationId });
      await executeAction(action_id);
      router.push(`/actions/${action_id}`);
    } catch {
      setApprovingId(null);
    }
  }

  async function handleReject(recommendationId: string) {
    setRejectingId(recommendationId);
    try {
      await reject.mutateAsync({ recommendationId });
    } finally {
      setRejectingId(null);
    }
  }

  async function handleBulkApprove() {
    if (selectedPendingIds.length === 0) return;
    setBulkMode("approve");
    try {
      for (const recommendationId of selectedPendingIds) {
        const { action_id } = await confirm.mutateAsync({ recommendationId });
        await executeAction(action_id);
      }
      setSelectedIds([]);
    } catch {
      /* mutations surface errors via react-query */
    } finally {
      setBulkMode(null);
    }
  }

  async function handleBulkReject() {
    if (selectedPendingIds.length === 0) return;
    setBulkMode("reject");
    try {
      for (const recommendationId of selectedPendingIds) {
        await reject.mutateAsync({ recommendationId });
      }
      setSelectedIds([]);
    } catch {
      /* react-query */
    } finally {
      setBulkMode(null);
    }
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) setSelectedIds([...pendingSelectableIds]);
    else setSelectedIds([]);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  }

  const filtersActive = riskFilter !== "all" || actionTypeFilter !== "all";

  if (isLoading && recommendations.length === 0) {
    return <AppLoading message="Loading recommendations…" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Recommendations</h1>
              <p className="text-sm text-muted-foreground">
                AI-generated actions to reduce your SaaS spend
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={generatePlan.isPending || bulkBusy}
                onClick={() => generatePlan.mutate(undefined)}
              >
                <RefreshCw
                  className={cn("size-4", generatePlan.isPending && "animate-spin")}
                  aria-hidden
                />
                Regenerate recommendations
              </Button>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">{tab === "pending" ? "Savings Potential" : "Savings Realized"}</div>
                <div className="font-mono text-2xl font-semibold tabular-nums text-success">
                  {formatCurrency(totalMonthlySavings)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(totalAnnualSavings)} annually
                </div>
              </div>
            </div>
          </div>

          {/* Tabs + inline count + filter popover */}
          <div className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 border-b border-border sm:border-0">
              {(["pending", "done"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "cursor-pointer px-4 py-2 text-sm font-medium capitalize transition-colors",
                    tab === t
                      ? "border-b-2 border-foreground text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-sm"
                  )}
                >
                  {t === "pending" ? "Pending" : "Completed"}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 pb-2 sm:pb-2">
              {recommendations.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {filtered.length}
                  </span>{" "}
                  of <span className="tabular-nums">{recommendations.length}</span>
                </p>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="relative shrink-0"
                    aria-label={
                      filtersActive
                        ? "Filters (active — open to edit)"
                        : "Open filters"
                    }
                  >
                    <Filter className="size-4" />
                    {filtersActive && (
                      <span
                        className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary"
                        aria-hidden
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[min(100vw-2rem,20rem)] p-4">
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Filters</div>
                    <div className="grid gap-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="filter-risk" className="text-xs text-muted-foreground">
                          Risk level
                        </Label>
                        <Select
                          value={riskFilter}
                          onValueChange={(v) => setRiskFilter(v as RegretRisk | "all")}
                        >
                          <SelectTrigger id="filter-risk" size="sm" className="w-full">
                            <SelectValue placeholder="Risk level" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[100]">
                            <SelectItem value="all">All levels</SelectItem>
                            {(["low", "medium", "high"] as const).map((r) => (
                              <SelectItem key={r} value={r}>
                                <span className="flex items-center gap-2">
                                  <span
                                    className={cn("size-2 shrink-0 rounded-full", RISK_DOT[r])}
                                    aria-hidden
                                  />
                                  {regretRiskConfig[r].label.replace(" risk", "")}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="filter-action-type" className="text-xs text-muted-foreground">
                          Action type
                        </Label>
                        <Select
                          value={actionTypeFilter}
                          onValueChange={(v) => setActionTypeFilter(v as ActionType | "all")}
                        >
                          <SelectTrigger id="filter-action-type" size="sm" className="w-full">
                            <SelectValue placeholder="Action type" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[100]">
                            <SelectItem value="all">All types</SelectItem>
                            {(["cancel", "downgrade", "negotiate", "switch"] as const).map((t) => {
                              const cfg = actionTypeConfig[t];
                              const Icon = cfg.icon;
                              return (
                                <SelectItem key={t} value={t}>
                                  <span className="flex items-center gap-2">
                                    <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                                    {cfg.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {filtersActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setRiskFilter("all");
                          setActionTypeFilter("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

{tab === "pending" && pendingSelectableIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    allPendingSelected
                      ? true
                      : selectedPendingIds.length > 0
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(v) => toggleSelectAll(v === true)}
                  disabled={bulkBusy}
                  aria-label="Select all pending recommendations"
                />
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>
              {selectedPendingIds.length > 0 && (
                <>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {selectedPendingIds.length} selected
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
                    disabled={bulkBusy}
                    onClick={handleBulkApprove}
                  >
                    {bulkMode === "approve" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Check className="size-4" aria-hidden />
                    )}
                    Approve selected
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={bulkBusy}
                    onClick={handleBulkReject}
                  >
                    {bulkMode === "reject" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <X className="size-4" aria-hidden />
                    )}
                    Reject selected
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    disabled={bulkBusy}
                    onClick={() => setSelectedIds([])}
                  >
                    Clear
                  </Button>
                </>
              )}
            </div>
          )}

          {/* List */}
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((action) => (
                <RecommendationCard
                  key={action.recommendation_id}
                  action={action}
                  onApprove={() => handleApprove(action.recommendation_id)}
                  onReject={() => handleReject(action.recommendation_id)}
                  isApproving={approvingId === action.recommendation_id}
                  isRejecting={rejectingId === action.recommendation_id}
                  showActions={action.status === "pending"}
                  bulkBusy={bulkBusy}
                  selection={
                    tab === "pending" && action.status === "pending"
                      ? {
                          checked: selectedIds.includes(action.recommendation_id),
                          onCheckedChange: (c) => toggleOne(action.recommendation_id, c),
                          disabled: bulkBusy,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                {recommendations.length === 0
                  ? tab === "pending"
                    ? "No pending recommendations"
                    : "Nothing completed yet"
                  : "No recommendations match the selected filters"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
