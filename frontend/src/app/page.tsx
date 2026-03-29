"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  PhoneCall,
  FileSearch,
  Bot,
  TrendingDown,
  AlertTriangle,
  X,
  Check,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Savings Calculator
// ─────────────────────────────────────────────
function SavingsCalculator() {
  const [headcount, setHeadcount] = useState(50);
  const monthlyWaste = Math.round(headcount * 48);
  const annualWaste = monthlyWaste * 12;
  const savedByOttofii = Math.round(annualWaste * 0.31);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 transition-colors hover:border-primary/40">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Savings Calculator</div>
        <h3 className="mt-1 font-display text-xl font-bold">How much are you actually wasting?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Industry average: $48/employee/month in unused SaaS.</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="headcount" className="text-muted-foreground">Company headcount</label>
          <span className="font-mono font-semibold tabular-nums">{headcount} people</span>
        </div>
        <input id="headcount" type="range" min={5} max={500} step={5} value={headcount}
          onChange={(e) => setHeadcount(Number(e.target.value))}
          className="w-full accent-[oklch(0.55_0.25_290)]" />
        <div className="flex justify-between text-xs text-muted-foreground"><span>5</span><span>500</span></div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
        <div>
          <div className="text-xs text-muted-foreground">Monthly waste</div>
          <div className="mt-0.5 font-mono text-xl font-bold text-destructive tabular-nums">${monthlyWaste.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Annual waste</div>
          <div className="mt-0.5 font-mono text-xl font-bold text-destructive tabular-nums">${annualWaste.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Ottofii recovers</div>
          <div className="mt-0.5 font-mono text-xl font-bold text-success tabular-nums">${savedByOttofii.toLocaleString()}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Based on 31% average recovery rate. Your mileage may vary.</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Live Activity Feed
// ─────────────────────────────────────────────
const FEED_LINES = [
  { time: "14:22:01", color: "text-muted-foreground", text: "Connecting to Gmail inbox…" },
  { time: "14:22:03", color: "text-primary", text: "Scanning for 'Invoice', 'Receipt', 'Subscription' keywords…" },
  { time: "14:22:09", color: "text-success", text: "Found 47 recurring charge receipts across 14 vendors." },
  { time: "14:22:11", color: "text-muted-foreground", text: "Cross-referencing with bank feed (Plaid)…" },
  { time: "14:22:14", color: "text-warning", text: "⚠ Zoom Pro · 40 seats licensed · 2 active in last 90 days." },
  { time: "14:22:15", color: "text-warning", text: "⚠ Adobe CC · 12 seats · last login 8 months ago." },
  { time: "14:22:16", color: "text-muted-foreground", text: "Benchmarking prices against industry data…" },
  { time: "14:22:19", color: "text-primary", text: "Generating ranked action plan…" },
  { time: "14:22:21", color: "text-success", text: "✓ Plan ready: 6 actions · $2,240/mo potential savings." },
  { time: "14:23:04", color: "text-muted-foreground", text: "User approved: Cancel Zoom Pro subscription." },
  { time: "14:23:05", color: "text-primary", text: "ElevenLabs voice agent dialing Zoom support (+1-888-799-9666)…" },
  { time: "14:23:08", color: "text-muted-foreground", text: "On hold. Estimated wait: 4 minutes." },
  { time: "14:27:12", color: "text-primary", text: "Connected to rep: Marcus T." },
  { time: "14:27:45", color: "text-success", text: "✓ Cancellation confirmed. ID: ZM-448291. Effective: end of billing cycle." },
  { time: "14:27:46", color: "text-success", text: "✓ Evidence stored. Audit log updated." },
];

function LiveFeed() {
  const [visibleCount, setVisibleCount] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount >= FEED_LINES.length) return;
    const delay = visibleCount < 5 ? 400 : visibleCount < 9 ? 600 : 800;
    const t = setTimeout(() => {
      setVisibleCount((c) => c + 1);
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
    }, delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[oklch(0.08_0_0)] shadow-xl">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-3 font-mono text-xs text-white/40">ottofii · agent · live</span>
      </div>
      <div ref={containerRef} className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-1.5 scrollbar-none">
        {FEED_LINES.slice(0, visibleCount).map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="shrink-0 text-white/30">[{line.time}]</span>
            <span className={line.color}>{line.text}</span>
          </div>
        ))}
        {visibleCount < FEED_LINES.length && (
          <div className="flex gap-3">
            <span className="text-white/30">[{FEED_LINES[visibleCount]?.time}]</span>
            <span className="inline-block h-3 w-1 animate-pulse bg-primary/60" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashboard Preview
// ─────────────────────────────────────────────
const DASH_ROWS = [
  { name: "Notion",             category: "SaaS",  cadence: "Monthly", amount: "$320",   seats: 16, usage: "None",   usageColor: "bg-destructive/15 text-destructive",  confidence: 91 },
  { name: "Figma",              category: "SaaS",  cadence: "Monthly", amount: "$180",   seats: 10, usage: "Low",    usageColor: "bg-warning/15 text-warning",           confidence: 85 },
  { name: "Zoom",               category: "SaaS",  cadence: "Monthly", amount: "$240",   seats: 12, usage: "Low",    usageColor: "bg-warning/15 text-warning",           confidence: 72 },
  { name: "Adobe Creative Cloud", category: "SaaS", cadence: "Monthly", amount: "$600",  seats: 8,  usage: "Low",    usageColor: "bg-warning/15 text-warning",           confidence: 88 },
  { name: "AWS",                category: "Cloud", cadence: "Monthly", amount: "$890",   seats: null, usage: "Low",  usageColor: "bg-warning/15 text-warning",           confidence: 65 },
  { name: "Slack",              category: "SaaS",  cadence: "Monthly", amount: "$1,200", seats: 60, usage: "Active", usageColor: "bg-success/15 text-success",           confidence: 10, protected: true },
];

function ConfidenceBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
        <div className="h-2.5 w-2.5 rounded-full bg-warning/50" />
        <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
        <div className="ml-3 flex-1 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">app.ottofii.ai/dashboard</div>
      </div>

      {/* Fake nav */}
      <div className="flex items-center gap-1 border-b border-border px-4 py-2 text-xs">
        <span className="rounded-md bg-muted px-3 py-1 font-medium text-foreground">Dashboard</span>
        <span className="px-3 py-1 text-muted-foreground">Recommendations</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        {[
          { label: "Total Monthly Spend", value: "$4,528", sub: "12 subscriptions detected", valueClass: "text-foreground" },
          { label: "Verified Savings",    value: "$320",   sub: "$3,840 annually",            valueClass: "text-success" },
          { label: "Pending Savings",     value: "$0",     sub: "Awaiting execution",          valueClass: "text-muted-foreground" },
          { label: "Actions",             value: "1 · 0 · 0", sub: "Succeeded / Pending / Failed", valueClass: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3">
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
            <div className={cn("mt-0.5 font-mono text-lg font-bold tabular-nums", s.valueClass)}>{s.value}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Table header */}
      <div className="border-b border-border px-4 py-2.5">
        <span className="text-sm font-semibold">Detected Subscriptions</span>
      </div>
      <div className="grid grid-cols-[1fr_60px_70px_64px_44px_80px_80px] items-center border-b border-border px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>Merchant</span><span>Category</span><span>Cadence</span><span className="text-right">Amount</span><span className="text-right">Seats</span><span>Usage</span><span className="text-right">Confidence</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {DASH_ROWS.map((row) => (
          <div key={row.name} className="grid grid-cols-[1fr_60px_70px_64px_44px_80px_80px] items-center px-4 py-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-sm">
              {row.name}
              {row.protected && (
                <span className="rounded border border-muted-foreground/20 px-1 py-px text-[9px] text-muted-foreground">Protected</span>
              )}
            </div>
            <span className="text-muted-foreground">{row.category}</span>
            <span className="text-muted-foreground">{row.cadence}</span>
            <span className="text-right font-mono font-semibold tabular-nums">{row.amount}</span>
            <span className="text-right text-muted-foreground">{row.seats ?? "—"}</span>
            <span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", row.usageColor)}>
                {row.usage}
              </span>
            </span>
            <div className="flex justify-end">
              <ConfidenceBar pct={row.confidence} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Before / After
// ─────────────────────────────────────────────
const comparisons = [
  {
    topic: "Finding subscriptions",
    before: "Someone manually audits 4 credit cards at the end of every quarter. They miss 3 things every time.",
    after: "Ottofii scans your bank, Gmail, and ERP automatically. Nothing hides.",
  },
  {
    topic: "Cancelling a subscription",
    before: "15-step click-to-cancel flow. Hold music. A \"retention specialist\" who offers you a discount to stay.",
    after: "Ottofii navigates the flow or calls support via voice agent. You get a confirmation ID.",
  },
  {
    topic: "Knowing what's safe to cut",
    before: "\"I think marketing uses that?\" Three Slack messages. One person who definitely doesn't know.",
    after: "Usage signals, seat counts, and last-login data surfaced automatically. Ranked by regret risk.",
  },
  {
    topic: "Audit trail",
    before: "A spreadsheet named 'subscriptions_FINAL_v3_REAL.xlsx' that's 8 months out of date.",
    after: "Every action logged with actor, timestamp, and vendor confirmation. Exportable. Always current.",
  },
];

// ─────────────────────────────────────────────
// Testimonials
// ─────────────────────────────────────────────
const testimonials = [
  {
    quote: "We had 14 Slack seats for a tool nobody had opened in 8 months. Ottofii found it, called the vendor, and got a refund for 3 months of overpayment.",
    name: "Rachel K.", title: "Head of Finance, Series B SaaS", initials: "RK", handle: "@rachelk_fin",
  },
  {
    quote: "I used to spend 2 hours every quarter hunting down subscriptions across 4 different credit cards. Now I just review the audit log and approve.",
    name: "James O.", title: "VP Engineering, 120-person startup", initials: "JO", handle: "@jamesodev",
  },
  {
    quote: "The vendor call feature is insane. I watched it talk to Salesforce support, hold for 8 minutes, and negotiate our contract down 22%.",
    name: "Priya M.", title: "CFO, Growth-stage fintech", initials: "PM", handle: "@priyam_cfo",
  },
  {
    quote: "Finally something that doesn't require a 6-month implementation. We were live in 20 minutes and found $4,200/month in waste on day one.",
    name: "Tom B.", title: "COO, 50-person agency", initials: "TB", handle: "@tombriggs",
  },
];

const integrations = ["Plaid", "Rippling", "NetSuite", "QuickBooks", "Stripe", "Ramp", "Brex", "Okta"];

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/90 px-6 backdrop-blur">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Ottofii</span>
        </div>
        <nav className="ml-8 hidden items-center gap-1 md:flex">
          {[["Features", "#features"], ["How it works", "#how-it-works"], ["Security", "#security"]].map(([label, href]) => (
            <a key={label} href={href} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">{label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Link href="/onboarding">
            <Button size="sm" className="rounded-lg gap-1.5 shadow-[0_1px_0_oklch(0.35_0.25_290)] hover:shadow-none active:translate-y-px transition-all">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="grain relative flex flex-col items-center overflow-hidden px-6 py-24 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <AlertTriangle className="h-3 w-3" />
          $48/employee/month. That's the average SaaS waste. Yours is probably higher.
        </div>
        <h1 className="font-display max-w-3xl text-5xl leading-tight md:text-6xl">
          The SaaS cleanup you've been{" "}
          <span className="text-primary">putting off for months.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Ottofii finds every forgotten subscription, figures out which ones nobody uses,
          and cancels them — including the ones that make you sit on hold for 40 minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding">
            <Button size="lg" className="rounded-xl gap-2 border border-primary/80 shadow-[inset_0_1px_0_oklch(0.78_0.15_290/0.35),0_2px_0_oklch(0.35_0.25_290)] hover:shadow-[inset_0_1px_0_oklch(0.78_0.15_290/0.2),0_1px_0_oklch(0.35_0.25_290)] active:shadow-none active:translate-y-0.5 transition-all duration-150 ease-in-out">
              Start cleaning up <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="rounded-xl">See a live demo</Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No credit card. No sales call. No 12-step onboarding doc.</p>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <DashboardPreview />
        </div>
      </section>

      {/* ── Integrations bar ── */}
      <section className="border-y border-border px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">Works with your existing stack</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {integrations.map((name) => (
              <span key={name} className="text-sm font-semibold text-muted-foreground/50 transition-colors hover:text-muted-foreground">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary text-center">Before vs. after</div>
          <h2 className="font-display mt-2 text-center text-3xl">
            This is what your finance team's life looks like right now.
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">And what it looks like with Ottofii. The contrast is a little embarrassing.</p>
          <div className="mt-10 space-y-3">
            {comparisons.map((c) => (
              <div key={c.topic} className="group grid overflow-hidden rounded-2xl border border-border transition-colors hover:border-primary/30 sm:grid-cols-2">
                <div className="flex gap-3 border-b border-border bg-muted/20 p-5 sm:border-b-0 sm:border-r group-hover:bg-muted/30 transition-colors">
                  <X className="mt-1 h-3.5 w-3.5 shrink-0 text-destructive/70" />
                  <div>
                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-destructive/60">Before</div>
                    <div className="mb-1.5 text-sm font-semibold text-foreground">{c.topic}</div>
                    <p className="text-sm text-muted-foreground">{c.before}</p>
                  </div>
                </div>
                <div className="flex gap-3 p-5 transition-colors group-hover:bg-success/5">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-success/80" />
                  <div>
                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-success/70">With Ottofii</div>
                    <div className="mb-1.5 text-sm font-semibold text-foreground">{c.topic}</div>
                    <p className="text-sm text-muted-foreground">{c.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Feed + Features ── */}
      <section id="features" className="border-b border-border px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary text-center">Features</div>
          <h2 className="font-display mt-2 text-center text-3xl">Built for the people who hate cancelling SaaS.</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Which is everyone. Especially the person who got burned by a vendor auto-renewing a $18k annual contract.
          </p>

          {/* Live feed section */}
          <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Live agent activity</div>
              <h3 className="font-display mt-1 text-2xl">You see every move it makes.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every detection, every decision, every call — logged in real time. It's not a black box. It's a very hardworking assistant that narrates everything it does.
              </p>
              <ul className="mt-4 space-y-1.5">
                {["Timestamped action log for every event", "Vendor confirmation IDs stored automatically", "Exportable for finance or compliance teams"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <LiveFeed />
          </div>

          {/* Feature cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: FileSearch, title: "Finds what you forgot", description: "Connect Gmail, Slack, your bank feed, or your ERP. Ottofii surfaces recurring charges across all of them — including the $240/mo tool IT signed up for in 2022." },
              { icon: TrendingDown, title: "Ranks by actual impact", description: "Not all subscriptions are equal. We score by usage signal, seat utilization, price vs. benchmark, and your likelihood to regret cancelling." },
              { icon: PhoneCall, title: "Makes the calls you don't want to make", description: "Our ElevenLabs voice agent calls vendor support on your behalf, navigates hold times, and gets a confirmation number." },
              { icon: Bot, title: "Autonomous or supervised — your call", description: "Run in Safe Mode and approve every action, or flip to Autonomous and let the agent execute within your policy while you review the log." },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-b border-border px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary text-center">How it works</div>
          <h2 className="font-display mt-2 text-center text-3xl">Three steps. Not thirty.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { step: "01", title: "Connect your data", description: "Link Gmail, Slack, your bank, or upload a CSV. The whole thing takes about 4 minutes.", detail: "Gmail · Slack · Bank · QuickBooks · CSV" },
              { step: "02", title: "Review what we found", description: "Ottofii surfaces every recurring charge, ranked by savings potential and usage signal.", detail: "Ranked by impact · Usage signal · Confidence score" },
              { step: "03", title: "Approve and move on", description: "Click approve. The agent executes — browser automation or a real phone call. You get a confirmation.", detail: "Browser · API · Voice call · Audit trail" },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                <div className="font-mono text-4xl font-bold text-primary/20">{item.step}</div>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-3 font-mono text-xs text-primary/50">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Savings Calculator ── */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <SavingsCalculator />
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="border-b border-border px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Security &amp; Trust</div>
              <h2 className="font-display mt-2 text-3xl">It won't cancel your payroll processor. We promise.</h2>
              <p className="mt-3 text-muted-foreground">Hard-coded policy guardrails that can't be overridden — not even in Autonomous mode.</p>
              <div className="mt-6 space-y-2">
                {["Legal contracts & SLAs", "Payroll & HR platforms", "Insurance policies", "Utilities & infrastructure", "Tax & compliance tools"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-warning" />
                    <span className="text-muted-foreground flex-1">{item}</span>
                    <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">Suggest only</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: ShieldCheck, title: "Full audit trail", description: "Every action is logged with actor, timestamp, and vendor confirmation ID." },
                { icon: Lock, title: "Read-only data access", description: "We never write to your bank, email, or ERP. Read access only, scoped to billing data." },
                { icon: CheckCircle2, title: "Approval workflows", description: "Every action requires explicit approval in Safe Mode. Autonomous mode is opt-in." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    <div>
                      <div className="font-semibold text-sm">{item.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:border-primary/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card font-mono text-[10px] font-bold text-muted-foreground">SOC2</div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">SOC 2 Type II</span> audit in progress. Enterprise security review available on request.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary text-center">What people say</div>
          <h2 className="font-display mt-2 text-center text-3xl">Mostly relief. Some disbelief.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {testimonials.map((t) => (
              <div key={t.name} className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary">{t.initials}</div>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.handle}</div>
                    </div>
                  </div>
                  <Twitter className="h-4 w-4 text-muted-foreground/40 group-hover:text-[#1d9bf0]/60 transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.quote}"</p>
                <div className="mt-3 text-xs text-muted-foreground">{t.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary px-6 py-20 text-center text-primary-foreground">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-3xl">You'll find something in the first 5 minutes.</h2>
          <p className="mt-3 text-primary-foreground/80">Every company does. The question is whether you want to find it today or in next quarter's board deck.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/onboarding">
              <Button size="lg" variant="secondary" className="rounded-xl gap-2 shadow-[0_2px_0_rgba(0,0,0,0.2)] hover:shadow-[0_1px_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="ghost" className="rounded-xl text-primary-foreground hover:bg-primary-foreground/10">View demo first</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-primary-foreground/60">No credit card required. No SDR will call you.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Ottofii</span>
            <span>· Built at YHack26</span>
          </div>
          <div className="flex gap-4">
            {["Privacy", "Terms", "Security"].map((item) => (
              <a key={item} href="#" className="hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
