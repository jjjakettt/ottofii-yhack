# System Architecture

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────┐
│                   DATA SOURCES                       │
│  ERP · AP Tools · Corporate Cards · SaaS · Cloud    │
│          [Hackathon: mock CSV / seeded DB]           │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  INGESTION LAYER                     │
│  Connector per source → normalize → emit events     │
│  Webhook support for push updates                   │
│          [Hackathon: seed script + REST upload]     │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│           NORMALIZATION + SPEND GRAPH               │
│                                                     │
│  Nodes: vendors, subscriptions, teams, users        │
│  Edges: payments, usage, ownership, overlap         │
│                                                     │
│  recurring_streams table (canonical object)         │
│  Merchant deduplication · Cadence detection         │
│  Confidence scoring                                 │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              INTELLIGENCE LAYER                     │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ Rule Engine  │  │ LLM Reasoning│                │
│  │ - Cadence    │  │ - Extraction │                │
│  │ - Variance   │  │ - Ranking    │                │
│  │ - Overlap    │  │ - Explanation│                │
│  └──────┬───────┘  └──────┬───────┘                │
│         └────────┬─────────┘                       │
│                  ▼                                  │
│           Decision Engine                           │
│       Savings Score × Confidence                    │
│       Regret Risk · Compliance Risk                 │
│       → Ranked ActionPlan (JSON)                    │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│            HUMAN-IN-THE-LOOP UI                     │
│                                                     │
│  Dashboard · Stream List · Recommendation Cards     │
│  Confirmation Modal · Audit Log · Savings Tracker   │
└────────────────────────┬────────────────────────────┘
                         │ (user approves)
                         ▼
┌─────────────────────────────────────────────────────┐
│               POLICY ENGINE                         │
│                                                     │
│  Allowlists · Thresholds · Role-based gates         │
│  Never-touch categories (rent/insurance/payroll)    │
│  Enterprise: approval routing by action class       │
└────────────────────────┬────────────────────────────┘
                         │ (policy passes)
                         ▼
┌─────────────────────────────────────────────────────┐
│               ACTION ENGINE                         │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ │
│  │ Vendor   │ │  Email   │ │Browser  │ │ Phone  │ │
│  │   API    │ │Automation│ │(Playwright│ │(Voice) │ │
│  └──────────┘ └──────────┘ └─────────┘ └────────┘ │
│                                                     │
│  Idempotency keys · Retry logic · Circuit breakers  │
│  State: PROPOSED→APPROVED→EXECUTING→SUCCEEDED       │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│           VERIFICATION + MONITORING                 │
│                                                     │
│  Vendor confirmation · Email parsing                │
│  Financial re-check (no future charge)              │
│  Screenshot evidence · Confirmation ID              │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│               AUDIT LOG                             │
│  Immutable · Actor + timestamp + payload            │
│  Every action, approval, and verification logged    │
└─────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Ingestion Layer
- One connector per data source
- Emits normalized `Transaction` events into pipeline
- Cursor-based sync for incremental updates (no re-processing)
- **Hackathon**: seed script writes directly to `recurring_streams` table

### Spend Graph / Normalization
- Merchant name deduplication (fuzzy match + LLM normalization)
- Cadence detection: group by merchant → detect periodic pattern
- Confidence scoring: occurrences, amount variance, cadence regularity
- The spend graph is the defensibility layer — richer than raw transactions

### Intelligence Layer

**Rule Engine (fast, interpretable)**
- Group transactions by normalized merchant name
- Flag periodic patterns (monthly/annual, low variance)
- Detect zero-usage signals (no logins, 0 API calls)
- Detect vendor overlaps (two tools with same category + features)
- Blocklist: rent, mortgage, insurance, payroll, taxes, utilities

**LLM Reasoning (Claude claude-sonnet-4-6)**
- Input: recurring streams (merchant, amount, cadence, usage signals, emails)
- Output: structured `ActionPlan` JSON (schema-constrained)
- Role: enrich explanations, handle ambiguous descriptors, rank by savings
- Prompt enforces: negative constraints, confirmation rules, JSON schema

**Decision Engine**
- Composite score: `savings_score × confidence × (1 - regret_risk) × feasibility`
- Three thresholds:
  - **Auto-act**: low risk, reversible, below policy threshold
  - **Recommend + confirm**: most actions (default safe mode)
  - **Do not touch**: rent, mortgage, regulated fees, production tools

### Action Engine
Four execution channels (ranked by reliability):

| Channel | Reliability | Use For |
|---------|------------|---------|
| Vendor API | High | SaaS with admin APIs |
| Email | Medium | Cancellation requests, paper trail |
| Browser (Playwright) | Medium | Consumer portals, long-tail vendors |
| Phone/IVR | Low-Medium | Negotiation, vendors without portals |

Each action has:
- `idempotency_key` — prevents duplicate execution
- State machine — `PROPOSED → APPROVED → EXECUTING → SUCCEEDED/FAILED → VERIFIED`
- Evidence stored — screenshot, confirmation ID, email body

### Policy Engine
- Validates action against org policy before execution
- Role-based: CFO sees all, IT can veto technical tools, AP executes
- Category blocklist enforced server-side (not just in prompts)

### Verification Layer
- Vendor confirmation: screenshot/HTML from portal
- Email confirmation: mailbox watcher parses confirmation emails
- Financial confirmation: check for absence of future charge (webhook trigger)

---

## API Surface (Hackathon Endpoints)

```
POST /connect/upload           → ingest CSV / mock transactions
GET  /recurring-streams        → list detected recurring streams
POST /agent/plan               → LLM generates ActionPlan JSON
POST /agent/confirm            → record user approval
POST /agent/execute            → trigger execution worker
GET  /actions/{id}             → status + evidence
GET  /savings/summary          → verified + pending savings totals
POST /webhooks/transactions    → (future) receive transaction updates
```

---

## Operating Modes

### Safe Mode (default)
```
Detect → Propose → Explain → User Confirms → Execute → Verify
```
Every action requires explicit approval. Full audit trail.

### Autonomous Mode (enterprise premium)
```
Detect → Policy Check → Auto-Execute (within thresholds) → Verify → Notify
```
Example policy: "Auto-cancel unused tools under $2,000/year"
Requires: approval gates, audit log, kill switch per vendor

---

## Scalability Design Principles

1. **Connector abstraction** — each data source is a pluggable connector; adding a new source = implement interface, register connector
2. **Tool schema versioning** — action tools are versioned JSON schemas; adding new action type = add schema + executor
3. **Spend graph** — normalized data model means intelligence layer doesn't care about source format
4. **Idempotency** — every action has a stable key; retries are safe
5. **State machine** — every action transitions through explicit states; resumable, auditable, inspectable
