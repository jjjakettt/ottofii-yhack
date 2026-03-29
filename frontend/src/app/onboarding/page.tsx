"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Mail,
  MessageSquare,
  CreditCard,
  FileText,
  BookOpen,
  Building2,
  ShieldCheck,
  Bot,
  Lock,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Connector = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  consentText: string;
};

type Goal = { id: string; label: string };
type AgentMode = "safe" | "autonomous";

const CONNECTORS: Connector[] = [
  {
    id: "gmail",
    label: "Gmail",
    description: "Detect recurring charges in email receipts",
    icon: Mail,
    consentText:
      "Ottofii wants to read your Gmail inbox to identify recurring subscription receipts and invoices. We never store email content — only extracted merchant and amount data.",
  },
  {
    id: "slack",
    label: "Slack",
    description: "Find SaaS tools your team mentions",
    icon: MessageSquare,
    consentText:
      "Ottofii wants to scan public Slack channels for mentions of SaaS tools and services to help identify shadow IT and unused subscriptions.",
  },
  {
    id: "bank",
    label: "Bank / Cards",
    description: "Analyze recurring card charges",
    icon: CreditCard,
    consentText:
      "Ottofii wants read-only access to your bank and card transactions to identify recurring payments. We use 256-bit encryption and never store raw account numbers.",
  },
  {
    id: "csv",
    label: "CSV Upload",
    description: "Import your own spend data",
    icon: FileText,
    consentText:
      "Ottofii will parse your uploaded CSV to extract vendor, amount, and date fields. The file is processed locally and not stored after analysis.",
  },
  {
    id: "quickbooks",
    label: "QuickBooks",
    description: "Pull invoices and vendor payments",
    icon: BookOpen,
    consentText:
      "Ottofii wants to connect to your QuickBooks account to read vendor payments and recurring invoices. No write access is requested.",
  },
];

const GOALS: Goal[] = [
  { id: "reduce_saas", label: "Reduce SaaS spend" },
  { id: "eliminate_unused", label: "Eliminate unused tools" },
  { id: "renegotiate", label: "Renegotiate contracts" },
  { id: "consolidate", label: "Consolidate vendors" },
];

const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Retail & E-commerce",
  "Manufacturing",
  "Media & Entertainment",
  "Education",
  "Professional Services",
  "Other",
];

const SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

const TOTAL_STEPS = 8;

// ─────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full">
      <div className="h-1 w-full bg-border">
        <div
          className="h-1 bg-primary transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
      <div className="mt-2 px-6 text-right text-xs text-muted-foreground">
        Step {step} of {TOTAL_STEPS}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Consent dialog
// ─────────────────────────────────────────────

function ConsentDialog({
  connector,
  onAllow,
  onDeny,
}: {
  connector: Connector;
  onAllow: () => void;
  onDeny: () => void;
}) {
  const Icon = connector.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Connect {connector.label}</div>
            <div className="text-xs text-muted-foreground">ottofii.ai is requesting access</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{connector.consentText}</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Your data is encrypted and never sold.
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onDeny}>
            Deny
          </Button>
          <Button
            className="flex-1 border border-primary/80 shadow-[inset_0_1px_0_oklch(0.78_0.15_290/0.35),0_2px_0_oklch(0.35_0.25_290)] hover:shadow-[inset_0_1px_0_oklch(0.78_0.15_290/0.2),0_1px_0_oklch(0.35_0.25_290)] active:shadow-none active:translate-y-px transition-all duration-150"
            onClick={onAllow}
          >
            Allow access
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Ingestion animation
// ─────────────────────────────────────────────

function IngestionAnimation({
  connectedSources,
  onDone,
}: {
  connectedSources: string[];
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"scanning" | "done">("scanning");
  const [progress, setProgress] = useState(0);
  const [currentSource, setCurrentSource] = useState(0);

  useEffect(() => {
    const sources = connectedSources.length > 0 ? connectedSources : ["demo"];
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setProgress(Math.min((i / (sources.length * 8)) * 100, 95));
      if (i % 8 === 0 && currentSource < sources.length - 1) {
        setCurrentSource((c) => c + 1);
      }
      if (i >= sources.length * 8) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setPhase("done"), 600);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const connectorMap = Object.fromEntries(CONNECTORS.map((c) => [c.id, c.label]));
  const sourceLabels = connectedSources.length > 0
    ? connectedSources.map((id) => connectorMap[id] ?? id)
    : ["Demo data"];
  const subscriptionCount = 13;

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-success/30 bg-success/10 text-success">
          <Check className="h-8 w-8" />
        </div>
        <div>
          <div className="font-display text-2xl font-bold">Analysis complete</div>
          <div className="mt-2 text-muted-foreground">
            Found{" "}
            <span className="font-semibold text-foreground">{subscriptionCount} recurring subscriptions</span>
            {" "}across your connected sources.
          </div>
        </div>
        <Button
          onClick={onDone}
          className="gap-2 border border-primary/80 shadow-[inset_0_1px_0_oklch(0.78_0.15_290/0.35),0_2px_0_oklch(0.35_0.25_290)] hover:shadow-[inset_0_1px_0_oklch(0.78_0.15_290/0.2),0_1px_0_oklch(0.35_0.25_290)] active:shadow-none active:translate-y-px transition-all duration-150"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <div>
        <div className="font-display text-2xl font-bold">Scanning your data…</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Processing{" "}
          <span className="font-medium text-foreground">{sourceLabels[currentSource]}</span>
        </div>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{Math.round(progress)}%</div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {sourceLabels.map((label, i) => (
          <span
            key={label}
            className={cn(
              "rounded-full border px-3 py-0.5 text-xs",
              i <= currentSource
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            {i < currentSource ? "✓ " : ""}{label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main wizard
// ─────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 – welcome (no state)
  // Step 2 – company profile
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");

  // Step 3 – sign in
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Step 4 – connectors
  const [connected, setConnected] = useState<string[]>([]);
  const [pendingConsent, setPendingConsent] = useState<Connector | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Step 5 – ingestion (handled by component)

  // Step 6 – goals
  const [goals, setGoals] = useState<string[]>([]);

  // Step 7 – agent mode
  const [agentMode, setAgentMode] = useState<AgentMode | null>(null);

  // Step 8 – done

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleConnectorClick(connector: Connector) {
    if (connected.includes(connector.id)) return;
    setPendingConsent(connector);
  }

  function handleConsentAllow() {
    if (!pendingConsent) return;
    const id = pendingConsent.id;
    setPendingConsent(null);
    setConnecting(id);
    setTimeout(() => {
      setConnected((prev) => [...prev, id]);
      setConnecting(null);
    }, 1400);
  }

  function handleConsentDeny() {
    setPendingConsent(null);
  }

  function toggleGoal(id: string) {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function handleFinish() {
    localStorage.setItem("ottofii_onboarded", "true");
    localStorage.setItem("ottofii_company", companyName || "Your Company");
    localStorage.setItem("ottofii_mode", agentMode ?? "safe");
    router.push("/dashboard");
  }

  const canProceed: Record<number, boolean> = {
    1: true,
    2: companyName.trim().length > 0 && industry.length > 0 && companySize.length > 0,
    3: userName.trim().length > 0 && userEmail.includes("@"),
    4: true,
    5: true,
    6: goals.length > 0,
    7: agentMode !== null,
    8: true,
  };

  const tactileBtn = "border border-primary/80 shadow-[inset_0_1px_0_oklch(0.78_0.15_290/0.35),0_2px_0_oklch(0.35_0.25_290)] hover:shadow-[inset_0_1px_0_oklch(0.78_0.15_290/0.2),0_1px_0_oklch(0.35_0.25_290)] active:shadow-none active:translate-y-px transition-all duration-150";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Ottofii</span>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <ProgressBar step={step} />

      {/* Consent dialog */}
      {pendingConsent && (
        <ConsentDialog
          connector={pendingConsent}
          onAllow={handleConsentAllow}
          onDeny={handleConsentDeny}
        />
      )}

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">

          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                <Zap className="h-8 w-8" />
              </div>
              <div>
                <h1 className="font-display text-3xl">Welcome to Ottofii</h1>
                <p className="mt-3 text-muted-foreground">
                  We'll help you find and eliminate wasteful SaaS spend in under 5 minutes.
                  Let's get your account set up.
                </p>
              </div>
              <div className="w-full space-y-2 rounded-2xl border border-border bg-muted/30 p-4 text-left text-sm">
                {[
                  "Connect your data sources",
                  "Review AI-generated savings recommendations",
                  "Approve actions or let Ottofii execute autonomously",
                ].map((item, i) => (
                  <div key={item} className="flex items-center gap-2 text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <Button size="lg" className={cn("gap-2", tactileBtn)} onClick={next}>
                Let's get started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── Step 2: Company profile ── */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display text-2xl">Tell us about your company</h2>
                <p className="mt-1 text-muted-foreground">
                  This helps us tailor recommendations to your industry and scale.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="company-name">Company name</Label>
                  <Input
                    id="company-name"
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="industry">Industry</Label>
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select industry…</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Company size</Label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCompanySize(size)}
                        className={cn(
                          "cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors",
                          companySize === size
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        {size} employees
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Sign in ── */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display text-2xl">Create your account</h2>
                <p className="mt-1 text-muted-foreground">
                  Any name and email will work for the demo.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="user-name">Your name</Label>
                  <Input
                    id="user-name"
                    placeholder="Jane Smith"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-email">Work email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="jane@acmecorp.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Connect sources ── */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display text-2xl">Connect your data sources</h2>
                <p className="mt-1 text-muted-foreground">
                  Connect at least one source so Ottofii can find your subscriptions. You can add more later.
                </p>
              </div>
              {/* Hidden CSV file input */}
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setCsvFileName(file.name);
                  setConnecting("csv");
                  setTimeout(() => {
                    setConnected((prev) => [...prev, "csv"]);
                    setConnecting(null);
                  }, 1600);
                }}
              />
              <div className="space-y-3">
                {CONNECTORS.map((connector) => {
                  const Icon = connector.icon;
                  const isConnected = connected.includes(connector.id);
                  const isConnecting = connecting === connector.id;
                  const isCsv = connector.id === "csv";

                  function handleClick() {
                    if (isConnected || isConnecting) return;
                    if (isCsv) {
                      csvInputRef.current?.click();
                    } else {
                      handleConnectorClick(connector);
                    }
                  }

                  return (
                    <button
                      key={connector.id}
                      type="button"
                      onClick={handleClick}
                      disabled={isConnected || isConnecting}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                        isConnected
                          ? "border-success/40 bg-success/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/40"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                        isConnected
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-primary/20 bg-primary/10 text-primary"
                      )}>
                        {isConnecting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isConnected ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{connector.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {isCsv && isConnected && csvFileName
                            ? csvFileName
                            : connector.description}
                        </div>
                      </div>
                      {isConnected && (
                        <span className="shrink-0 text-xs font-medium text-success">Connected</span>
                      )}
                      {!isConnected && !isConnecting && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {isCsv ? "Upload →" : "Connect →"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 5: Ingestion ── */}
          {step === 5 && (
            <IngestionAnimation
              connectedSources={connected}
              onDone={next}
            />
          )}

          {/* ── Step 6: Goals ── */}
          {step === 6 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display text-2xl">What are your goals?</h2>
                <p className="mt-1 text-muted-foreground">
                  Select everything that applies — Ottofii will prioritize recommendations accordingly.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {GOALS.map((goal) => {
                  const selected = goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleGoal(goal.id)}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-4 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {selected && <Check className="h-4 w-4 shrink-0" />}
                        <span className="font-medium">{goal.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 7: Agent mode ── */}
          {step === 7 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display text-2xl">How should Ottofii operate?</h2>
                <p className="mt-1 text-muted-foreground">
                  You can change this at any time from settings.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAgentMode("safe")}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-5 text-left transition-colors",
                    agentMode === "safe"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <ShieldCheck className={cn("mb-3 h-7 w-7", agentMode === "safe" ? "text-primary" : "text-muted-foreground")} />
                  <div className="font-semibold">Safe mode</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Ottofii surfaces recommendations. You approve every action before anything happens.
                  </div>
                  <div className="mt-3 text-xs font-medium text-primary">Recommended</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAgentMode("autonomous")}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-5 text-left transition-colors",
                    agentMode === "autonomous"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Bot className={cn("mb-3 h-7 w-7", agentMode === "autonomous" ? "text-primary" : "text-muted-foreground")} />
                  <div className="font-semibold">Autonomous mode</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Ottofii executes within your policy and reports back. You review the audit log.
                  </div>
                </button>
              </div>
              <div className="flex gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>
                  <strong>Always protected:</strong> Legal contracts, payroll, insurance, utilities, and tax obligations
                  can only receive suggestions — Ottofii will never act on these automatically, in any mode.
                </span>
              </div>
            </div>
          )}

          {/* ── Step 8: Done ── */}
          {step === 8 && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-success/30 bg-success/10 text-success">
                <Check className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-display text-2xl">You're all set{companyName ? `, ${companyName}` : ""}!</h2>
                <p className="mt-2 text-muted-foreground">
                  Ottofii is ready to help you save money.
                </p>
              </div>
              <div className="w-full space-y-2 rounded-2xl border border-border bg-muted/30 p-4 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium">{companyName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sources connected</span>
                  <span className="font-medium">{connected.length > 0 ? connected.length : "Demo data"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goals</span>
                  <span className="font-medium">{goals.length > 0 ? `${goals.length} selected` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent mode</span>
                  <span className="font-medium capitalize">{agentMode ?? "—"}</span>
                </div>
              </div>
              <Button size="lg" className={cn("gap-2", tactileBtn)} onClick={handleFinish}>
                View your dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Navigation buttons (not shown on step 1, 5, or 8) */}
          {step !== 1 && step !== 5 && step !== 8 && (
            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" className="gap-1.5" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={next}
                disabled={!canProceed[step]}
                className={cn("gap-1.5", tactileBtn)}
              >
                {step === 4 ? (connected.length > 0 ? "Continue" : "Skip for now") : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
