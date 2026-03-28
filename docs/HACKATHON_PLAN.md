# Hackathon Execution Plan — 24 Hours

## Goal

Demonstrate the full loop end-to-end:

```
[Mock Data / Upload] → [Detect Recurring Spend] → [LLM Action Plan (JSON)]
     → [User Approves] → [Execute (Playwright demo)] → [Verify + Show Savings]
```

This is a **vertical slice**, not a full system. Depth > breadth.

---

## What We Are NOT Building (cut ruthlessly)

- Real bank/Plaid integration (mock it)
- Real vendor API cancellation (Playwright against our own demo portal)
- Email connector (stub it)
- Auth system (hardcode a user or use a simple session)
- Mobile UI

---

## Phase Breakdown

### Phase 1 — Foundation (Hours 0–4)

**Goal: skeleton running, data seeded, endpoints wired**

- [ ] Repo structure: `frontend/`, `backend/`, `scripts/`
- [ ] DB schema created (see [DATA_MODEL.md](DATA_MODEL.md))
- [ ] Seed script: 10–15 mock recurring streams with varied categories, amounts, confidence
- [ ] `GET /recurring-streams` returns seeded data
- [ ] Frontend: basic list view renders streams
- [ ] `POST /agent/plan` calls LLM and returns `ActionPlan` JSON (hardcoded input for now)

**Owner suggestions**: 1 person on DB+seed, 1 person on backend skeleton, 1 person on frontend scaffold

---

### Phase 2 — Intelligence Layer (Hours 4–10)

**Goal: LLM reads spend data and produces structured, ranked action plan**

- [ ] Detection logic: rule-based grouping by merchant + cadence + amount variance
- [ ] LLM prompt: feed recurring streams, get back `ActionPlan` with scored recommendations
- [ ] Structured output enforced via JSON Schema (no free-form parsing)
- [ ] Scoring: savings score × confidence × regret risk
- [ ] Policy guardrails in prompt: never touch rent/insurance/payroll/utilities
- [ ] `POST /agent/plan` fully wired: reads from DB, calls LLM, returns plan

**Key output**: `ActionPlan` JSON with `actions[]` each having:
```json
{
  "stream_id": "...",
  "merchant": "Notion",
  "action_type": "cancel",
  "monthly_savings": 320,
  "confidence": 0.87,
  "regret_risk": "low",
  "explanation": "0 logins in 90 days across 16 seats. Duplicate of Confluence.",
  "strategy": { "channel": "api", "runbook_id": "notion_cancel_v1" },
  "idempotency_key": "cancel_notion_acme_2024_03"
}
```

See [ACTION_ENGINE.md](ACTION_ENGINE.md) for full schema.

---

### Phase 3 — Action Execution (Hours 10–16)

**Goal: user approves an action, system executes it, shows proof**

- [ ] `POST /agent/confirm` records approval + writes `action` row with status `APPROVED`
- [ ] `POST /agent/execute` triggers execution worker
- [ ] Playwright script against our demo portal (see [ACTION_ENGINE.md](ACTION_ENGINE.md))
- [ ] Demo portal pages: `/login`, `/subscriptions`, `/confirm-cancel`, `/receipt`
- [ ] Execution updates action status: `EXECUTING → SUCCEEDED`
- [ ] Evidence stored: confirmation ID, screenshot path
- [ ] `GET /actions/{id}` returns status + evidence

---

### Phase 4 — UI Polish + Savings Tracker (Hours 16–22)

**Goal: judges can follow the whole story in the UI**

- [ ] Dashboard: "We found $X/month in recoverable spend"
- [ ] Stream list with confidence badge + category tag
- [ ] Action recommendation cards with explanation
- [ ] Confirmation modal before execution
- [ ] Live status: `Executing… → Succeeded` + proof display
- [ ] Savings tracker: verified vs pending
- [ ] Sandbox mode toggle (no auth required, uses seeded data)

---

### Phase 5 — Demo Prep + Buffer (Hours 22–24)

- [ ] End-to-end demo rehearsal
- [ ] Seed reset script (`python seed.py --reset`)
- [ ] README with demo instructions
- [ ] Slides: 1 slide per core concept (problem → architecture → demo → roadmap)

---

## Priority Stack Rank

If time runs short, cut in this order (bottom first):

1. **MUST**: Seeded data → LLM plan → JSON output displayed
2. **MUST**: Confirm action → execute → show result
3. **MUST**: Savings summary on dashboard
4. **SHOULD**: Playwright execution against demo portal
5. **SHOULD**: Confidence scoring + regret risk display
6. **NICE**: Audit log view
7. **CUT**: Real integrations, auth, mobile

---

## Sandbox Mode

Include a toggle in the UI: `Use Demo Data`. When on:
- No auth required
- Pre-seeded 12 recurring streams loaded
- LLM plan pre-generated (cache it for speed)
- Playwright runs against local demo portal

This ensures the demo always works regardless of network/API issues.

---

## Demo Script (Rehearse This)

1. Open app → "We analyzed your spend"
2. Show stream list: "12 recurring charges found, $4,200/month"
3. Click into top recommendation: "Notion — 16 seats, 0 logins in 90 days, $320/mo"
4. Show AI explanation with evidence
5. Click "Approve Cancellation"
6. Watch status: Executing → Succeeded
7. Show confirmation ID + screenshot proof
8. Dashboard updates: "$320/month saved (verified)"

Total demo time: ~3 minutes
