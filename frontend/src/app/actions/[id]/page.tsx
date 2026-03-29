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
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AppHeader } from "@/components/app-header";
import { AppLoading } from "@/components/app-loading";
import { useAction } from "@/hooks/useAction";
import { useQueryClient } from "@tanstack/react-query";
import { cancelAction, retryAction } from "@/apis/agent";
import {
  formatPhoneForDisplay,
  stripEmotionTags,
  VOICE_AGENT_NAME,
} from "@/lib/call-transcript";
import { formatEvidencePrimaryLine, getScreenshotDataUrl } from "@/lib/evidence-display";
import { cn } from "@/lib/utils";
import type { ActionEvidence, ActionStatus as ActionStatusType, ActionType } from "@/types";

function CallTranscriptEvidence({
  ev,
  title,
}: {
  ev: Extract<ActionEvidence, { type: "call_transcript" }>;
  title: string;
}) {
  const [conversationOpen, setConversationOpen] = useState(false);
  const transcript: Array<{ role: string; message: string }> =
    ev.payload.transcript ?? [];
  const agentName = ev.payload.voice_agent_name ?? VOICE_AGENT_NAME;
  const accountHolder = ev.payload.account_holder;
  const accountPhone = ev.payload.account_phone;
  const merchant = ev.payload.subscription_merchant;

  const turnCount =
    transcript.length > 0
      ? transcript.length
      : ev.payload.transcript_text
        ? Math.max(1, ev.payload.transcript_text.split("\n").filter(Boolean).length)
        : 0;

  return (
    <div className="p-4 sm:p-5">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/50 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{agentName} is the voice agent on this call.</p>
        </div>

        {(accountHolder != null || accountPhone != null || merchant != null) && (
          <div className="grid gap-3 border-b border-border px-4 py-3 sm:grid-cols-3 sm:px-5">
            {accountHolder != null && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Account holder
                </div>
                <div className="text-sm font-medium text-foreground">{accountHolder}</div>
              </div>
            )}
            {accountPhone != null && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Phone on file
                </div>
                <div className="font-mono text-sm text-foreground">{formatPhoneForDisplay(accountPhone)}</div>
              </div>
            )}
            {merchant != null && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Subscription
                </div>
                <div className="text-sm font-medium text-foreground">{merchant}</div>
              </div>
            )}
          </div>
        )}

        <div className="border-b border-border px-4 py-3 sm:px-5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Vendor line
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
            <span className="font-medium text-foreground">{ev.payload.contact_name}</span>
            <span className="font-mono text-muted-foreground">{ev.payload.contact_phone}</span>
          </div>
        </div>

        {ev.payload.confirmation_number != null && String(ev.payload.confirmation_number).trim() !== "" && (
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5">
              <FileCheck className="h-4 w-4 shrink-0 text-success" />
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Confirmation number
                </div>
                <div className="font-mono text-base font-semibold tabular-nums text-foreground">
                  {ev.payload.confirmation_number}
                </div>
              </div>
            </div>
          </div>
        )}

        <Collapsible
          open={conversationOpen}
          onOpenChange={setConversationOpen}
          className="bg-muted/20"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/40 sm:px-5"
            >
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Conversation
                </div>
                <div className="text-sm font-medium text-foreground">
                  {turnCount > 0 ? `${turnCount} turn${turnCount === 1 ? "" : "s"}` : "Transcript"}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {conversationOpen ? "Hide" : "Show"} full transcript
                  </span>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  conversationOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-4 pt-1 sm:px-4">
              {transcript.length > 0 ? (
                <div className="space-y-3">
                  {transcript.map((turn, i) => {
                    const isAgent = turn.role === "agent";
                    const body = stripEmotionTags(String(turn.message ?? ""));
                    const label = isAgent ? agentName : "Support";
                    const initial = isAgent ? agentName.charAt(0) : "S";
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex gap-3",
                          isAgent ? "flex-row" : "flex-row-reverse",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            isAgent
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground",
                          )}
                          aria-hidden
                        >
                          {initial}
                        </div>
                        <div
                          className={cn(
                            "max-w-[min(100%,28rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                            isAgent
                              ? "rounded-tl-sm border border-primary/20 bg-primary/10 text-foreground"
                              : "rounded-tr-sm border border-border bg-background text-foreground",
                          )}
                        >
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {label}
                          </div>
                          <p className="whitespace-pre-wrap break-words">{body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : ev.payload.transcript_text ? (
                <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-4 font-sans text-sm text-foreground">
                  {stripEmotionTags(ev.payload.transcript_text)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No transcript lines returned.</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

function agentStepMessages(
  actionType: ActionType,
  merchant: string,
  channel?: string,
): string[] {
  const m = merchant;

  if (channel === "phone") {
    return [
      `Browser automation unavailable for ${m}…`,
      "Initiating phone call via Otto…",
      "Otto connected — requesting cancellation…",
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
    call_transcript: "Phone cancellation",
    browser_failure: "Browser Automation Failed",
    execution_cancelled: "Execution Stopped",
    phone_attempt: "Phone Attempt",
    phone_retry_scheduled: "Next call scheduled",
  };
  const title = titleMap[ev.type] ?? ev.type;

  if (ev.type === "execution_cancelled") {
    return (
      <div className="p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-muted/50">
            <CancelIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-sm font-medium">{title}</div>
            <p className="text-sm text-muted-foreground">
              You stopped this run. You can retry when you are ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (ev.type === "phone_retry_scheduled") {
    return (
      <div className="p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/30 bg-primary/10">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="text-sm font-medium">{title}</div>
            {ev.payload.message != null && (
              <p className="text-sm text-muted-foreground">{String(ev.payload.message)}</p>
            )}
            <p className="text-sm text-foreground">
              Another attempt will run automatically in about{" "}
              <span className="font-medium">{ev.payload.retry_window_minutes ?? "1–2"} minutes</span>
              {ev.payload.next_contact_name != null && (
                <>
                  {" "}
                  (next: <span className="font-medium">{ev.payload.next_contact_name}</span>
                  {ev.payload.next_contact_phone != null && (
                    <span className="font-mono text-muted-foreground">
                      {" "}
                      · {String(ev.payload.next_contact_phone)}
                    </span>
                  )}
                  ).
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (ev.type === "phone_attempt") {
    return (
      <div className="p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-warning/30 bg-warning/10">
            <Phone className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-sm font-medium">{title}</div>
            <p className="text-xs text-muted-foreground">
              {ev.payload.contact_name != null && (
                <>
                  <span className="font-medium text-foreground">{String(ev.payload.contact_name)}</span>
                  {" · "}
                </>
              )}
              <span className="font-mono">{String(ev.payload.contact_phone ?? "")}</span>
            </p>
            {ev.payload.error != null && (
              <p className="text-sm text-muted-foreground">{String(ev.payload.error)}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

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
    return <CallTranscriptEvidence ev={ev} title={title} />;
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
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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

  async function handleRetry() {
    setIsRetrying(true);
    try {
      await retryAction(id);
      queryClient.invalidateQueries({ queryKey: ["action", id] });
    } finally {
      setIsRetrying(false);
    }
  }

  async function handleCancel() {
    setIsCancelling(true);
    try {
      await cancelAction(id);
      queryClient.invalidateQueries({ queryKey: ["action", id] });
    } finally {
      setIsCancelling(false);
    }
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

            {action.status === "executing" && (
              <div className="border-b border-border px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 sm:w-auto"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Stop and mark failed
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Use this if the call is stuck (e.g. no answer) and you want to stop or try again later.
                </p>
              </div>
            )}

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
              {action.status === "failed" && (
                <Button onClick={handleRetry} disabled={isRetrying} className="gap-2">
                  {isRetrying
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RefreshCw className="h-4 w-4" />
                  }
                  Retry
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
              <Button variant={action.status === "failed" ? "outline" : "default"} asChild>
                <Link href="/recommendations">More Recommendations</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
