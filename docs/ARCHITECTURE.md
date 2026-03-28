# System Architecture

## The Core Loop (Single User Flow)

```
User connects sources
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  LAYER 1 — INGESTION + DETECTION          [ Person 2 owns ]  │
│                                                               │
│  Mock connectors:                                             │
│    Bank/Cards → transaction records                           │
│    Gmail      → email receipt/renewal records                 │
│    Slack      → SaaS app install + activity signals           │
│    CSV Upload → raw transaction rows                          │
│                                                               │
│  Normalization:                                               │
│    Deduplicate merchants · Detect cadence · Score confidence  │
│                                                               │
│  Output: recurring_streams table (canonical spend objects)    │
│  Endpoint: GET /recurring-streams                             │
└───────────────────────────────┬───────────────────────────────┘
                                │ recurring_streams[]
                                ▼
┌───────────────────────────────────────────────────────────────┐
│  LAYER 2 — INTELLIGENCE (LLM AGENT)       [ Person 3 owns ]  │
│                                                               │
│  Input:  recurring_streams[] from Layer 1                     │
│  Model:  Claude claude-sonnet-4-6 with structured outputs             │
│                                                               │
│  Steps:                                                       │
│    1. Score each stream (savings × confidence × regret risk)  │
│    2. Apply blocklist (rent/insurance/payroll → skip)         │
│    3. Generate explanation + evidence per action              │
│    4. Return ranked ActionPlan JSON (schema-constrained)      │
│                                                               │
│  Output: ActionPlan JSON → stored in action_plans table       │
│  Endpoints: POST /agent/plan                                  │
│             POST /agent/confirm                               │
└───────────────────────────────┬───────────────────────────────┘
                                │ ActionPlan JSON
                                ▼
┌───────────────────────────────────────────────────────────────┐
│  LAYER 3 — FRONTEND + APPROVAL UI         [ Person 1 owns ]  │
│                                                               │
│  Pages:                                                       │
│    / (landing)      → connector selection or demo mode        │
│    /dashboard       → savings summary + stream list           │
│    /recommendations → ranked action cards with evidence       │
│    /actions/{id}    → execution status + proof                │
│                                                               │
│  User actions:                                                │
│    Connect source → POST /connect/mock                        │
│    View plan      → GET  /agent/plan (cached)                 │
│    Approve action → POST /agent/confirm                       │
│    Watch status   → GET  /actions/{id} (poll or SSE)         │
└───────────────────────────────┬───────────────────────────────┘
                                │ user approves action
                                ▼
┌───────────────────────────────────────────────────────────────┐
│  LAYER 4 — POLICY + EXECUTION + VERIFY    [ Person 4 owns ]  │
│                                                               │
│  Policy check (before execution):                             │
│    Blocklist categories · is_protected flag · thresholds      │
│                                                               │
│  Execution channels (hackathon):                              │
│    Browser (Playwright) → against our own demo portal         │
│    Email stub            → log email that would be sent       │
│                                                               │
│  Demo portal (Person 4 builds):                               │
│    /demo/login · /demo/subscriptions                          │
│    /demo/confirm-cancel · /demo/receipt                       │
│                                                               │
│  State machine: APPROVED → EXECUTING → SUCCEEDED/FAILED       │
│  Evidence stored: confirmation_id, screenshot                 │
│                                                               │
│  Endpoints: POST /agent/execute                               │
│             GET  /actions/{id}                                │
│             GET  /savings/summary                             │
└───────────────────────────────────────────────────────────────┘
```

---

## Detection: Rules, Not an Agent

Detection (Layer 1) is **deterministic**, not LLM-powered. This is intentional:

| | Rule-based Detection | LLM Agent Detection |
|--|---------------------|---------------------|
| Speed | Fast (ms) | Slow (seconds) |
| Reliability | Predictable | Non-deterministic |
| Debuggability | Easy to inspect | Hard to audit |
| Hackathon risk | Low | High |

The LLM's job is **planning and explanation** — it reads the already-structured output from Layer 1 and decides what to do about it. This separation makes each layer independently testable and the demo more reliable.

Detection rules:
1. Group transactions by normalized merchant name
2. Flag if: 2+ occurrences, amount variance < 10%, periodic cadence (monthly/annual)
3. Pull zero-usage signals from Slack connector data
4. Detect category overlaps (two tools tagged `project-management`, `video-conferencing`, etc.)
5. Blocklist: payroll, rent, mortgage, insurance, utilities, taxes → confidence = 0, never surfaced

---

## API Surface (Full Map)

```
Ingestion (Layer 1 / Person 2)
  POST /connect/mock          body: { source: 'bank'|'gmail'|'slack'|'csv', file? }
  GET  /recurring-streams     returns: RecurringStream[]

Intelligence (Layer 2 / Person 3)
  POST /agent/plan            body: { user_goal? }  → returns: ActionPlan
  POST /agent/confirm         body: { recommendation_id, approved_by }  → returns: { action_id }

Frontend calls these (Person 1 consumes all of the above)

Execution (Layer 4 / Person 4)
  POST /agent/execute         body: { action_id }  → returns: { status }
  GET  /actions/{id}          returns: Action + ActionEvidence[]
  GET  /savings/summary       returns: { verified_usd, pending_usd, action_count }
```

All request/response shapes are defined in [TEAM.md](TEAM.md).

---

## Data Flow (Simplified)

```
[Mock connector data]
        │
        │  seed / POST /connect/mock
        ▼
[recurring_streams table]          ← Person 2 writes, Person 3 reads
        │
        │  POST /agent/plan
        ▼
[action_plans + recommendations]   ← Person 3 writes, Person 1 reads
        │
        │  POST /agent/confirm (user approves in UI)
        ▼
[actions table — status: APPROVED] ← Person 3 writes, Person 4 reads
        │
        │  POST /agent/execute
        ▼
[actions table — status: SUCCEEDED]← Person 4 writes, Person 1 reads
[action_evidence table]
```

---

## Tech Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Frontend | Next.js 14 (App Router) + Tailwind | Person 1 |
| Backend | FastAPI (Python) | Shared — one repo |
| Database | SQLite (hackathon) → Postgres | Schema in DATA_MODEL.md |
| LLM | Claude claude-sonnet-4-6 via Anthropic SDK | Structured output mode |
| Automation | Playwright (Python or Node) | Against local demo portal |
| Job queue | Inline async (FastAPI BackgroundTasks) | No Redis needed for MVP |

---

## Operating Modes

**Safe Mode (only mode for hackathon)**
```
Detect → Plan → Show in UI → User confirms → Execute → Verify
```
Every action requires explicit user approval. No auto-execution.

**Autonomous Mode (post-hackathon)**
Policy-scoped auto-execution within thresholds. Approval gates for edge cases.
