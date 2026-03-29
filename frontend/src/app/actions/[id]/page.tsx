"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Image as ImageIcon,
  ArrowLeft,
  XCircle as CancelIcon,
  MinusCircle,
  MessageSquare,
  ArrowRightLeft,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { AppLoading } from "@/components/app-loading";
import { useAction } from "@/hooks/useAction";
import { formatEvidencePrimaryLine, getScreenshotDataUrl } from "@/lib/evidence-display";
import { cn } from "@/lib/utils";
import type { ActionEvidence, ActionStatus as ActionStatusType, ActionType } from "@/types";

function agentStepMessages(
  actionType: ActionType,
  merchant: string,
  channel?: string,
): string[] {
  const m = merchant;

  if (channel === "phone") {
    return [
      `Browser automation unavailable for ${m}…`,
      "Initiating phone call via Jamie…",
      "Jamie connected — requesting cancellation…",
      "Declining retention offers…",
      "Awaiting confirmation number…",
    ];
  }

  switch (actionType) {
    case "cancel":
      return [
        `Mapping ${m} subscription footprint…`,
        "Opening secure browser session…",
        "Locating cancellation controls…",
        "Submitting cancellation request…",
        "Waiting for provider confirmation…",
      ];
    case "downgrade":
      return [
        `Analyzing ${m} seat usage…`,
        "Checking downgrade eligibility…",
        "Drafting plan change…",
        "Applying new tier…",
      ];
    case "negotiate":
      return [
        `Gathering ${m} contract signals…`,
        "Drafting negotiation brief…",
        "Simulating savings scenarios…",
        "Preparing outreach…",
      ];
    case "switch":
      return [
        `Comparing ${m} alternatives…`,
        "Validating migration path…",
        "Provisioning target workspace…",
        "Cutting over traffic…",
      ];
    default:
      return [
        "Initializing agent…",
        "Connecting to workspace…",
        "Running verification…",
        "Applying changes…",
      ];
  }
}

function AgentExecutionSteps({
  active,
  actionType,
  merchant,
  channel,
}: {
  active: boolean;
  actionType: ActionType;
  merchant: string;
  channel?: string;
}) {
  const steps = useMemo(
    () => agentStepMessages(actionType, merchant, channel),
    [actionType, merchant, channel]
  );
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }
    setStepIndex(0);
    const id = window.setInterval(() => {
      setStepIndex((i) => (i + 1) % steps.length);
    }, 1300);
    return () => window.clearInterval(id);
  }, [active, actionType, merchant]);

  if (!active) return null;

  return (
    <div
      className="border-b border-border bg-muted/30 p-6"
      role="status"
      aria-live="polite"
      aria-label="Agent execution progress"
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        Agent working
      </div>
      <p
        key={stepIndex}
        className="min-h-[3rem] text-sm leading-relaxed text-foreground"
      >
        {steps[stepIndex]}
        <span className="ml-0.5 inline-block w-6 animate-pulse text-muted-foreground">
          …
        </span>
      </p>
      <div className="mt-4 flex gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i === stepIndex
                ? "bg-primary"
                : i < stepIndex
                  ? "bg-primary/40"
                  : "bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function EvidenceBlock({ ev }: { ev: ActionEvidence }) {
  const screenshotSrc =
    ev.type === "screenshot" ? getScreenshotDataUrl(ev.payload) : null;

  const titleMap: Record<string, string> = {
    confirmation_id: "Confirmation ID",
    email: "Email",
    screenshot: "Screenshot",
    call_transcript: "Call Transcript",
    browser_failure: "Browser Automation Failed",
  };
  const title = titleMap[ev.type] ?? ev.type;

  if (ev.type === "browser_failure") {
    return (
      <div className="p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-warning/30 bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-sm font-medium">{title}</div>
            <p className="text-sm text-muted-foreground">{ev.payload.error}</p>
            {ev.payload.fallback && (
              <p className="text-xs text-muted-foreground">
                Fallback: <span className="font-medium text-foreground capitalize">{ev.payload.fallback} call</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (ev.type === "call_transcript") {
    const transcript: Array<{ role: string; message: string }> =
      ev.payload.transcript ?? [];
    return (
      <div className="p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/30 bg-primary/10">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-muted-foreground">
              Called{" "}
              <span className="font-medium text-foreground">{ev.payload.contact_name}</span>
              {" · "}
              <span className="font-mono">{ev.payload.contact_phone}</span>
            </div>
            {transcript.length > 0 ? (
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                {transcript.map((turn, i) => (
                  <div key={i} className={cn("flex gap-2 text-sm", turn.role === "agent" ? "justify-start" : "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2",
                        turn.role === "agent"
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {turn.role === "agent" ? "Jamie" : "Support Rep"}
                      </span>
                      {turn.message}
                    </div>
                  </div>
                ))}
              </div>
            ) : ev.payload.transcript_text ? (
              <pre className="whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-sans text-sm text-foreground">
                {ev.payload.transcript_text}
              </pre>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background">
          {ev.type === "confirmation_id" ? (
            <FileCheck className="h-5 w-5 text-success" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="text-sm font-medium capitalize">{title}</div>
          {ev.type === "screenshot" && screenshotSrc ? (
            <img
              src={screenshotSrc}
              alt="Execution screenshot"
              className="max-h-[28rem] w-full max-w-full rounded-md border border-border object-contain object-left"
            />
          ) : ev.type === "screenshot" && ev.payload.path ? (
            <p className="break-all font-mono text-sm text-foreground">{ev.payload.path}</p>
          ) : ev.type === "confirmation_id" && ev.payload.id ? (
            <p className="break-all font-mono text-sm text-foreground">{ev.payload.id}</p>
          ) : ev.type === "email" ? (
            <div className="space-y-1 text-sm">
              {ev.payload.subject && <p className="font-medium">{ev.payload.subject}</p>}
              {ev.payload.body && (
                <pre className="whitespace-pre-wrap break-words font-sans text-muted-foreground">
                  {ev.payload.body}
                </pre>
              )}
            </div>
          ) : (
            <p className="break-all font-mono text-sm text-muted-foreground">
              {formatEvidencePrimaryLine(ev) ?? JSON.stringify(ev.payload)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const statusConfig: Record<
  ActionStatusType,
  {
    icon: typeof Clock;
    label: string;
    className: string;
    bgClassName: string;
  }
> = {
  proposed: {
    icon: Clock,
    label: "Proposed",
    className: "text-muted-foreground",
    bgClassName: "bg-muted",
  },
  approved: {
    icon: CheckCircle2,
    label: "Approved",
    className: "text-primary",
    bgClassName: "bg-primary/20",
  },
  executing: {
    icon: Loader2,
    label: "Executing",
    className: "text-warning",
    bgClassName: "bg-warning/20",
  },
  succeeded: {
    icon: CheckCircle2,
    label: "Succeeded",
    className: "text-success",
    bgClassName: "bg-success/20",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "text-destructive",
    bgClassName: "bg-destructive/20",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    className: "text-muted-foreground",
    bgClassName: "bg-muted",
  },
};

const actionTypeConfig = {
  cancel: { icon: CancelIcon, label: "Cancel" },
  downgrade: { icon: MinusCircle, label: "Downgrade" },
  negotiate: { icon: MessageSquare, label: "Negotiate" },
  switch: { icon: ArrowRightLeft, label: "Switch" },
};

function StatusTimeline({ status }: { status: ActionStatusType }) {
  const steps = ["approved", "executing", "succeeded"] as const;

  if (status === "proposed") {
    return (
      <p className="text-sm text-muted-foreground">
        This action is proposed and not yet approved.
      </p>
    );
  }

  if (status === "failed" || status === "rejected") {
    return (
      <p className="text-sm text-destructive capitalize">
        Ended with status: {status}
      </p>
    );
  }

  const idx = steps.indexOf(status as (typeof steps)[number]);
  const activeIdx = idx === -1 ? 0 : idx;

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const config = statusConfig[step];
        const Icon = config.icon;
        const isActive = step === status;
        const isComplete = activeIdx > index;

        return (
          <div key={step} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-8",
                  isComplete || isActive ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center border",
                isActive && step === "executing"
                  ? "border-warning bg-warning/20"
                  : isComplete
                    ? "border-success bg-success/20"
                    : isActive
                      ? "border-primary bg-primary/20"
                      : "border-border bg-card"
              )}
            >
              {isActive && step === "executing" ? (
                <Loader2 className="h-4 w-4 animate-spin text-warning" />
              ) : isComplete || (isActive && step === "succeeded") ? (
                <CheckCircle2
                  className={cn(
                    "h-4 w-4",
                    isComplete || status === "succeeded"
                      ? "text-success"
                      : config.className
                  )}
                />
              ) : (
                <Icon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ActionStatusPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { action, isLoading, error } = useAction(id);
  if (isLoading) {
    return <AppLoading message="Loading action…" />;
  }

  if (error || !action) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Action not found</p>
          <Button variant="outline" asChild>
            <Link href="/recommendations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recommendations
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const statusInfo = statusConfig[action.status];
  const StatusIcon = statusInfo.icon;
  const actionInfo = actionTypeConfig[action.action_type];
  const ActionIcon = actionInfo.icon;
  const terminal = action.status === "succeeded" || action.status === "failed";

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Link
            href="/recommendations"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Recommendations
          </Link>

          <div className="border border-border bg-card">
            <div className="border-b border-border p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center border border-border bg-background">
                    <ActionIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                      {action.merchant}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="capitalize">{actionInfo.label}</span>
                      <span>via {action.channel}</span>
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 text-sm font-medium",
                    statusInfo.bgClassName,
                    statusInfo.className
                  )}
                >
                  {action.status === "executing" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <StatusIcon className="h-3.5 w-3.5" />
                  )}
                  {statusInfo.label}
                </div>
              </div>
            </div>

            <div className="border-b border-border p-6">
              <div className="text-sm text-muted-foreground">Monthly Savings</div>
              <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-success">
                {formatCurrency(action.monthly_savings_usd)}
              </div>
            </div>

            <AgentExecutionSteps
              active={action.status === "executing"}
              actionType={action.action_type}
              merchant={action.merchant}
              channel={action.channel}
            />


            <div className="border-b border-border p-6">
              <div className="mb-4 text-sm font-medium text-muted-foreground">
                Execution Progress
              </div>
              <StatusTimeline status={action.status} />
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Approved At</div>
                <div className="mt-1 font-mono text-sm tabular-nums">
                  {formatDateTime(action.approved_at)}
                </div>
              </div>
              {action.executed_at && (
                <div>
                  <div className="text-xs text-muted-foreground">Executed At</div>
                  <div className="mt-1 font-mono text-sm tabular-nums">
                    {formatDateTime(action.executed_at)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(action.status === "succeeded" || action.status === "failed") && action.evidence.length > 0 && (
            <div className="border border-border bg-card">
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-medium">Proof of Completion</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Action results and artifacts from execution.
                </p>
              </div>
              <div className="divide-y divide-border">
                {action.evidence.map((ev, index) => (
                  <EvidenceBlock key={index} ev={ev} />
                ))}
              </div>
            </div>
          )}

          {terminal && (
            <div className="flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/recommendations">More Recommendations</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
