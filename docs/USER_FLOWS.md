# User Flow

One generic flow that works for any user — individual, startup, or enterprise team.
The goal: connect your tools, see what you're wasting, take action.

---

## The Core Loop

```
┌─────────────────────────────────────────────────────────────┐
│  1. CONNECT                                                 │
│     User connects one or more data sources                  │
│     (or uses sandbox demo data — no auth required)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. DETECT                                                  │
│     System ingests + normalizes data across all sources     │
│     Recurring streams identified with confidence scores     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ANALYZE                                                 │
│     AI generates ranked ActionPlan (structured JSON)        │
│     Each action: savings estimate, evidence, risk level     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. DECIDE                                                  │
│     User reviews recommendations with AI explanations       │
│     Approves, rejects, or defers each action                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. EXECUTE                                                 │
│     System carries out approved actions                     │
│     Live status: Queued → Executing → Succeeded             │
│     Proof shown: confirmation ID / screenshot               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  6. VERIFY + TRACK                                          │
│     Savings marked verified vs pending                      │
│     Audit log of every action taken                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1 — Connect

User lands on a connector page. Pick one or more sources. Each is a mock/stub for the hackathon.

```
┌─────────────────────────────────────────────────────────────┐
│  Connect your tools                                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  💳 Bank /   │  │  📧 Gmail /  │  │  💬 Slack    │     │
│  │    Cards     │  │    Email     │  │              │     │
│  │              │  │              │  │              │     │
│  │  Catches     │  │  Catches     │  │  Catches     │     │
│  │  charges +   │  │  renewal     │  │  SaaS tool   │     │
│  │  recurring   │  │  notices,    │  │  installs +  │     │
│  │  payments    │  │  invoices,   │  │  usage       │     │
│  │              │  │  receipts    │  │  signals     │     │
│  │  [ Connect ] │  │  [ Connect ] │  │  [ Connect ] │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐                                          │
│  │  📄 CSV /    │                                          │
│  │   Upload     │                                          │
│  │              │                                          │
│  │  Upload any  │                                          │
│  │  transaction │                                          │
│  │  export      │                                          │
│  │              │                                          │
│  │  [ Upload ]  │                                          │
│  └──────────────┘                                          │
│                                                             │
│  ─────────────── or ───────────────                        │
│                                                             │
│  [ Use demo data — no account needed ]                     │
└─────────────────────────────────────────────────────────────┘
```

### What each connector contributes

| Connector | What it detects | Why it matters |
|-----------|----------------|----------------|
| **Bank / Cards** | Recurring charges by merchant, amount, cadence | Highest coverage backbone — catches most subscriptions |
| **Gmail / Email** | Renewal notices, invoices, receipts, trial → paid conversions | Catches things that don't show clearly on card statements (app stores, intermediated billing) |
| **Slack** | Which SaaS apps are installed as integrations; workspace activity signals | Surfaces tools the team has but nobody uses; strong zero-usage signal |
| **CSV Upload** | Any transaction export from any bank, card, or accounting tool | Universal fallback — works for anyone, no OAuth needed |

### Connector behavior (hackathon implementation)

All connectors are **mocked** — they don't make real OAuth calls. When a user "connects":
1. Show an OAuth-style consent screen (fake)
2. After "authorize", load a pre-seeded dataset for that source
3. Combine all connected source datasets into the unified `recurring_streams` table

Sandbox mode bypasses step 1–2 entirely and loads the full seeded dataset directly.

---

## Step 2 — Detect

After connecting, the system runs detection automatically.

```
┌─────────────────────────────────────────────────────────────┐
│  Analyzing your connected sources...                        │
│                                                             │
│  ✓ Bank/Cards      → 847 transactions scanned              │
│  ✓ Gmail           → 312 emails parsed                     │
│  ✓ Slack           → 23 app integrations found             │
│                                                             │
│  [████████████████████████] 100%                           │
│                                                             │
│  Found 12 recurring streams                                 │
│  Estimated monthly spend: $4,240                           │
└─────────────────────────────────────────────────────────────┘
```

Detection logic (runs server-side):
- Group by normalized merchant name across all sources
- Detect periodic patterns: monthly / annual / quarterly
- Flag low/zero usage from Slack signals and email activity
- Detect vendor overlaps (two tools in same category)
- Apply blocklist: payroll, rent, insurance, utilities → never flagged

---

## Step 3 — Analyze (AI Action Plan)

AI reads all detected streams and generates a ranked `ActionPlan`.

```
┌─────────────────────────────────────────────────────────────┐
│  Your Savings Opportunities                                 │
│                                                             │
│  Potential monthly savings: $1,870                         │
│  Potential annual savings:  $22,440                        │
│                                                             │
│  12 recurring charges · 8 with recommendations             │
│  4 skipped (active / protected)                            │
└─────────────────────────────────────────────────────────────┘
```

Each recommendation card shows:
- Merchant name + logo
- Monthly cost + seat count (if applicable)
- AI-generated explanation with evidence
- Confidence badge: High / Medium / Low
- Regret risk badge: Low / Medium / High
- Suggested action: Cancel / Downgrade / Negotiate

---

## Step 4 — Decide

User reviews each recommendation and approves or dismisses.

```
┌─────────────────────────────────────────────────────────────┐
│  #1  Notion                              $320/month         │
│      16 seats · monthly · SaaS                             │
│                                                             │
│  Why we flagged this:                                       │
│  "0 logins across all 16 seats in the last 90 days.        │
│   Confluence is active for the same use case.              │
│   Cancellation is low-risk."                               │
│                                                             │
│  Evidence: 0 active seats · last login 97 days ago         │
│            Duplicate: Confluence (active)                   │
│            Source: Bank charge + Gmail renewal notice       │
│                                                             │
│  Confidence: ●●●○  High      Regret risk: Low              │
│                                                             │
│  [ ✓ Cancel — save $320/mo ]   [ ✗ Dismiss ]   [ Defer ]  │
└─────────────────────────────────────────────────────────────┘
```

Confirmation modal before execution:
```
┌─────────────────────────────────────────────────────────────┐
│  Confirm cancellation                                       │
│                                                             │
│  Cancel Notion subscription                                 │
│  16 seats · $320/month                                     │
│                                                             │
│  This action will be executed via browser automation.      │
│  You can undo this within 24 hours if needed.              │
│                                                             │
│  [ Cancel subscription ]      [ Go back ]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 5 — Execute

Live status shown in UI after approval.

```
┌─────────────────────────────────────────────────────────────┐
│  Notion · Cancel subscription                               │
│                                                             │
│  ⏳ Queued                                                  │
│  ⚙️  Executing... (navigating vendor portal)               │
│  ✅ Succeeded                                               │
│                                                             │
│  Confirmation ID: NOT-2024-38291                           │
│  [ View screenshot proof ]                                  │
└─────────────────────────────────────────────────────────────┘
```

On failure:
```
│  ⚠️  Execution failed — vendor portal changed              │
│  We'll retry via email. You can also handle this manually. │
│  [ Send cancellation email ]   [ Mark as manual ]          │
```

---

## Step 6 — Verify + Track

Savings dashboard updates after each action.

```
┌─────────────────────────────────────────────────────────────┐
│  Savings Tracker                                            │
│                                                             │
│  Verified savings this month:    $320  ✅                  │
│  Pending verification:           $480  ⏳                  │
│  Actions taken:                  3                         │
│  Actions pending your review:    5                         │
│                                                             │
│  [ View audit log ]                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Flow Diagram (end-to-end)

```
User
 │
 ├─ Selects connectors (Bank · Gmail · Slack · CSV)
 │   └─ [mock OAuth] → seeded data loaded per source
 │
 ├─ Detection runs
 │   └─ recurring_streams table populated with confidence scores
 │
 ├─ POST /agent/plan
 │   └─ LLM reads streams → returns ActionPlan JSON
 │
 ├─ User reviews recommendation cards
 │   ├─ Dismiss → status = rejected
 │   └─ Approve → POST /agent/confirm
 │                └─ action row created (status = APPROVED)
 │
 ├─ POST /agent/execute
 │   └─ Playwright runs against demo portal
 │       ├─ success → status = SUCCEEDED, evidence stored
 │       └─ failure → status = FAILED, retry / escalate
 │
 └─ Dashboard updates with verified savings
```

---

## Future: Role-Based Views

Once the core loop is proven, role-based views are just a filter + permission layer on top:

- **CFO**: sees aggregate dashboard + policy config
- **AP / Finance**: sees the recommendation inbox (what we built for MVP)
- **IT**: sees tool inventory + can mark tools as protected
- **Procurement**: sees vendor overlap + negotiation suggestions

The underlying flow and data model don't change — just what each role sees and can act on.
