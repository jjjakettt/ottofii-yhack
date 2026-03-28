# Hackathon Execution Plan — 24 Hours / 4 People

## The Demo We're Building

```
Connect (mock) → Detect → AI Plan → User Approves → Execute → Verified Savings
```

One linear flow, one user, four connectors (Bank, Gmail, Slack, CSV). See [USER_FLOWS.md](USER_FLOWS.md).

---

## Team Split

| Person | Domain | Owns |
|--------|--------|------|
| **Person 1** | Frontend | Next.js UI, all pages, API consumption |
| **Person 2** | Data / Detection | DB schema, seed data, connectors, normalization, detection rules |
| **Person 3** | Intelligence / Agent | LLM prompt, ActionPlan generation, scoring, `/agent/plan`, `/agent/confirm` |
| **Person 4** | Execution / Policy | Demo portal, Playwright executor, policy engine, `/agent/execute`, `/actions/{id}` |

**Interface contracts between people are defined in [TEAM.md](TEAM.md). Read it before writing code.**

---

## Person 1 — Frontend

**Stack**: Next.js 14 (App Router) + Tailwind CSS

### Pages to Build

| Route | Purpose |
|-------|---------|
| `/` | Landing — connector selection + "Use demo data" button |
| `/dashboard` | Savings summary + stream list |
| `/recommendations` | Ranked action cards with evidence + approve/reject |
| `/actions/[id]` | Execution status + proof (screenshot / confirmation ID) |

### Task List

- [ ] Project scaffold: `npx create-next-app` with Tailwind
- [ ] Layout + nav shell
- [ ] `/` — connector cards (Bank, Gmail, Slack, CSV) + demo mode button
  - Clicking "Connect" → fake OAuth screen → success → redirect to dashboard
  - "Use demo data" → POST /connect/mock with `source: 'demo'` → redirect to dashboard
- [ ] `/dashboard` — fetch `GET /recurring-streams`, show total spend, stream count
- [ ] `/recommendations` — fetch `POST /agent/plan` (or cached), render ActionPlan cards
  - Each card: merchant, amount, explanation, confidence badge, regret risk badge
  - Approve button → `POST /agent/confirm` → redirect to `/actions/{id}`
  - Dismiss button → mark rejected locally
- [ ] `/actions/[id]` — poll `GET /actions/{id}`, show live status + evidence
- [ ] Savings tracker widget (reusable): fetch `GET /savings/summary`
- [ ] Sandbox mode: skip connector step, load demo data directly

### Key Contracts to Consume

See [TEAM.md](TEAM.md) for exact response shapes for each endpoint.

---

## Person 2 — Data / Detection

**Stack**: Python, SQLite (via SQLAlchemy or raw sqlite3), seed scripts

### Task List

- [ ] DB schema: create all tables from [DATA_MODEL.md](DATA_MODEL.md)
  - `users`, `connections`, `recurring_streams`, `recommendations`, `actions`, `action_evidence`, `audit_events`
- [ ] Migration script (or just `init_db.py` for hackathon)
- [ ] Seed script: 12 realistic recurring streams (see seed table in DATA_MODEL.md)
  - Vary: categories, cadence, usage signals, confidence, overlap scenarios
  - Include 1–2 protected/blocked streams (Slack at confidence 0.10)
- [ ] Mock connector endpoints: `POST /connect/mock`
  - `source: 'bank'` → load bank transaction seed
  - `source: 'gmail'` → load email receipt seed
  - `source: 'slack'` → load SaaS install/usage seed
  - `source: 'csv'` → accept file upload, parse into transactions
  - `source: 'demo'` → load full combined seed (all sources)
- [ ] Detection service (`detection.py`):
  - Group raw transactions by normalized merchant name
  - Detect cadence: monthly / annual / quarterly (≥ 2 occurrences, amount variance < 10%)
  - Pull usage signal from Slack connector records
  - Detect category overlaps (two `saas` tools with same tag)
  - Confidence score: function of occurrence count, variance, usage signal
  - Write detected streams to `recurring_streams` table
- [ ] `GET /recurring-streams` endpoint — returns `RecurringStream[]`

### Detection is Rules, Not LLM

Keep it deterministic. Fast, testable, inspectable. See ARCHITECTURE.md for rationale.

### Key Output (what Person 3 depends on)

`recurring_streams` table populated and `GET /recurring-streams` returning correct shape. See [TEAM.md](TEAM.md).

---

## Person 3 — Intelligence / Agent

**Stack**: Python, Anthropic SDK (Claude claude-sonnet-4-6), JSON schema validation (pydantic)

### Task List

- [ ] `POST /agent/plan` endpoint
  - Fetch `recurring_streams` from DB
  - Build prompt (see [ACTION_ENGINE.md](ACTION_ENGINE.md) for prompt template)
  - Call Claude claude-sonnet-4-6 with structured output (JSON schema constrained)
  - Validate response against `ActionPlan` schema (pydantic model)
  - Write `action_plans` + `recommendations` rows to DB
  - Return `ActionPlan` JSON to caller
- [ ] `POST /agent/confirm` endpoint
  - Validate `recommendation_id` exists and is in `pending` status
  - Write `action` row: status = `APPROVED`, `approved_by`, `approved_at`
  - Return `{ action_id }`
- [ ] Scoring logic (server-side, before LLM call):
  - Compute `savings_score`, `regret_risk`, `confidence` per stream
  - Pass scores as structured input to the LLM (don't ask LLM to infer from raw data)
- [ ] Prompt engineering:
  - System prompt with hard constraints (blocklist, schema rules, confirmation requirement)
  - User message with structured stream data + org context
  - Test with mock data offline before wiring endpoint
- [ ] Pydantic models for `ActionPlan`, `ActionItem`, `Evidence` (share with Person 4)

### Key Contracts

- **Depends on**: `GET /recurring-streams` (Person 2)
- **Produces for Person 1**: `ActionPlan` JSON (see [TEAM.md](TEAM.md))
- **Produces for Person 4**: `actions` table row with `tool_args` JSON

---

## Person 4 — Execution / Policy

**Stack**: Python (FastAPI), Playwright (Python), Next.js pages for demo portal (inside `frontend/`)

### How It All Connects

```
User approves in frontend UI
        │
        ▼
POST /agent/execute   ← your endpoint
        │
        ├─ policy check (is_protected? blocked category?)
        │
        ├─ Playwright opens a real browser
        │   navigates to YOUR demo portal (localhost:3000/demo/...)
        │   logs in → finds subscription → clicks cancel → reads receipt
        │
        ├─ stores confirmation_id + screenshot as evidence
        │
        └─ updates action status → SUCCEEDED
                │
                ▼
GET /actions/{id}  ← Person 1 polls this, shows proof in UI
```

Playwright needs a **real website** to click through — it cannot automate an in-memory object.
Instead of navigating real vendor sites (CAPTCHAs, 2FA, ToS), you build a tiny fake portal
with the same UX shape and Playwright automates that instead. Same code, same proof, zero friction.

### Part A — Demo Portal  ✅ DONE
Live at `frontend/src/app/demo/` — 4 Next.js pages already created:

| Route | Purpose | Key Playwright selectors |
|-------|---------|--------------------------|
| `/demo/login` | Email + password form | `input[name="email"]`, `button[type="submit"]` |
| `/demo/subscriptions` | List of fake tools with Cancel buttons | `button[data-subscription-id="X"][data-action="cancel"]` |
| `/demo/confirm-cancel?id=X&merchant=Y&amount=Z` | Confirm step | `button[data-action="confirm"]` |
| `/demo/receipt?id=X&merchant=Y` | Shows confirmation ID | `[data-field="confirmation_id"]` |

Any credentials work on the login page (it's fake). Subscriptions list matches the seed data merchants.

### Part B — Playwright Executor

File: `backend/executors/browser_cancel.py`

- [ ] Create `backend/executors/` folder + `__init__.py`
- [ ] Write `browser_cancel(merchant: str, subscription_id: str) -> dict` async function:
  - Launch headless Chromium via Playwright
  - Navigate to `{DEMO_PORTAL_URL}/demo/login`
  - Fill email + password → submit
  - Navigate to `/demo/subscriptions`
  - Click `button[data-subscription-id="{subscription_id}"][data-action="cancel"]`
  - Wait for redirect to `/demo/confirm-cancel`
  - Click `button[data-action="confirm"]`
  - Wait for redirect to `/demo/receipt`
  - Read `[data-field="confirmation_id"]` text content
  - Take screenshot → save to `backend/evidence/{action_id}.png`
  - Return `{ "confirmation_id": "...", "screenshot_path": "..." }`
- [ ] Test standalone: `python -m executors.browser_cancel` before wiring to endpoint

### Part C — Policy Engine

File: `backend/policy.py`

- [ ] Write `check_policy(stream, action_type) -> dict` function:
  ```python
  BLOCKED_CATEGORIES = ['payroll', 'rent', 'mortgage', 'insurance', 'utility', 'tax']

  def check_policy(stream, action_type):
      if stream.is_protected:
          return { "allowed": False, "reason": "Stream is marked protected" }
      if stream.category in BLOCKED_CATEGORIES:
          return { "allowed": False, "reason": f"Category '{stream.category}' is never auto-acted on" }
      return { "allowed": True, "reason": None }
  ```

### Part D — Backend Endpoints

File: `backend/routers/actions.py`

- [ ] `POST /agent/execute`
  - Fetch `action` row by `action_id`, validate `status == "approved"`
  - Fetch linked `recommendation` → fetch linked `recurring_stream`
  - Run `check_policy(stream, action.tool_name)`
  - If blocked: update status → `"failed"`, return 403 with reason
  - Update status → `"executing"`
  - Dispatch based on channel in `tool_args`:
    - `"browser"` → call `browser_cancel(merchant, subscription_id)`
    - `"email"` → log stub (print to console, status → `"succeeded"`)
  - On success: update status → `"succeeded"`, set `executed_at`
  - Write two `action_evidence` rows: `confirmation_id` + `screenshot`
  - Write `audit_events` row
  - Return `{ "action_id": ..., "status": "succeeded" }`

- [ ] `GET /actions/{action_id}`
  - Fetch `action` row + all linked `action_evidence` rows
  - Return `ActionDetail` schema (see TEAM.md)
  - Person 1 polls this every 2 seconds to show live status

- [ ] `GET /savings/summary`
  - Query: sum `recommendations.savings_usd` where linked `action.status == "succeeded"`
  - Query: sum where `action.status in ("approved", "executing")` → pending
  - Return `SavingsSummary` schema (see TEAM.md)

- [ ] Register router in `main.py`:
  ```python
  from routers import actions
  app.include_router(actions.router)
  ```

### Key Contracts

- **Depends on**: `actions` table written by Person 3 (status = `"approved"`)
- **Depends on**: Demo portal running at `DEMO_PORTAL_URL` (Part A — already done)
- **Produces for Person 1**: `GET /actions/{id}` with status + evidence
- **Produces for Person 1**: `GET /savings/summary` with verified/pending totals

### Execution Order

```
1. Test demo portal works in browser (localhost:3000/demo/login)
2. Write + test browser_cancel.py standalone against demo portal
3. Write policy.py
4. Wire POST /agent/execute using browser_cancel + policy
5. Wire GET /actions/{id}
6. Wire GET /savings/summary
7. Add router to main.py
8. Integration test: full loop with Person 1 and Person 3
```

---

## Shared Setup (Everyone / First 2 Hours)

- [ ] One repo, one `backend/` folder, one `frontend/` folder
- [ ] Backend: FastAPI app skeleton + DB init + shared pydantic models
- [ ] Frontend: Next.js scaffold + Tailwind config
- [ ] `.env.example` with: `ANTHROPIC_API_KEY`, `DATABASE_URL`, `DEMO_PORTAL_URL`
- [ ] `seed.py --reset` script (Person 2 leads, others can run it)

**Do not block on each other.** If your dependency isn't ready, use the mock/stub from [TEAM.md](TEAM.md).

---

## Timeline

| Hours | Milestone |
|-------|-----------|
| 0–2 | Shared setup: repo, DB init, FastAPI skeleton, Next.js scaffold |
| 2–6 | Each person working in their lane using stubs for dependencies |
| 6–10 | First integration: Person 1 + 2 (streams appear in UI) |
| 10–14 | Second integration: Person 1 + 3 (ActionPlan renders in UI) |
| 14–18 | Third integration: Person 1 + 4 (approve → execute → status shown) |
| 18–22 | Full loop working end-to-end · UI polish · savings tracker |
| 22–24 | Demo rehearsal · seed reset · README · slides |

---

## Priority Stack (cut from bottom if time runs short)

1. **MUST**: `GET /recurring-streams` returns seeded data, UI displays it
2. **MUST**: `POST /agent/plan` returns valid `ActionPlan` JSON, cards render in UI
3. **MUST**: Approve action → execute → show status + confirmation ID
4. **MUST**: Savings summary updates after execution
5. **SHOULD**: Playwright execution against demo portal (vs. hardcoded mock response)
6. **SHOULD**: Confidence + regret risk badges in UI
7. **SHOULD**: Connector selection screen with mock OAuth
8. **NICE**: Audit log view
9. **CUT**: Real integrations, real auth, CSV parsing edge cases

---

## Demo Script (3 minutes — rehearse this)

1. Open app → click "Use demo data" (skip connector flow for speed)
2. Dashboard: "Found 12 recurring charges · $4,240/month"
3. Navigate to Recommendations → show ranked cards
4. Click into **Notion** card: "16 seats, 0 logins in 90 days, $320/mo"
5. Show AI explanation: evidence, confidence badge, overlap with Confluence
6. Click "Approve Cancellation" → confirmation modal
7. Watch: Queued → Executing → Succeeded
8. Show proof: confirmation ID + screenshot
9. Dashboard updates: "$320/month verified savings"

Total: ~3 min. Practice it until it's smooth.
