# Team Contracts & Interfaces

This is the source of truth for how the four work streams connect.
**If you change a shared interface, update this doc and tell your team.**

Your AI assistant should read this file before writing any code that crosses a boundary.

---

## Ownership Map

```
Person 2 (Detection)  →  recurring_streams table  →  Person 3 (Agent)
Person 3 (Agent)      →  recommendations + actions →  Person 1 (Frontend)
Person 1 (Frontend)   →  POST /agent/confirm       →  Person 4 (Execution)
Person 4 (Execution)  →  GET /actions/{id}         →  Person 1 (Frontend)
```

---

## Shared Types (Pydantic — put in `backend/models.py`)

```python
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class Cadence(str, Enum):
    monthly = "monthly"
    annual = "annual"
    quarterly = "quarterly"

class UsageSignal(str, Enum):
    active = "active"
    low = "low"
    none = "none"
    unknown = "unknown"

class ActionType(str, Enum):
    cancel = "cancel"
    downgrade = "downgrade"
    negotiate = "negotiate"
    switch = "switch"

class RegretRisk(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class ActionStatus(str, Enum):
    proposed = "proposed"
    approved = "approved"
    executing = "executing"
    succeeded = "succeeded"
    failed = "failed"
    rejected = "rejected"

class Channel(str, Enum):
    browser = "browser"
    email = "email"
    api = "api"

# ─────────────────────────────────────────────
# LAYER 1 OUTPUT (Person 2 produces)
# ─────────────────────────────────────────────

class RecurringStream(BaseModel):
    id: str
    merchant: str
    raw_merchant: str
    category: str                   # 'saas' | 'cloud' | 'media' | 'utility' | ...
    cadence: Cadence
    amount_usd: float
    seat_count: Optional[int]
    usage_signal: UsageSignal
    confidence: float               # 0.0 – 1.0
    is_protected: bool
    notes: Optional[str]            # email snippets, overlap info, etc.
    first_seen: str                 # ISO date
    last_seen: str                  # ISO date
    occurrence_count: int

# ─────────────────────────────────────────────
# LAYER 2 OUTPUT (Person 3 produces)
# ─────────────────────────────────────────────

class Evidence(BaseModel):
    last_login_days_ago: Optional[int]
    active_seat_count: Optional[int]
    total_seat_count: Optional[int]
    duplicate_tools: Optional[List[str]]
    benchmark_price_per_seat: Optional[float]
    sources: List[str]              # e.g. ['bank', 'slack']

class Strategy(BaseModel):
    channel: Channel
    runbook_id: Optional[str]
    fallback_channel: Optional[Channel]
    email_template_id: Optional[str]

class ActionItem(BaseModel):
    recommendation_id: str
    stream_id: str
    merchant: str
    action_type: ActionType
    monthly_savings_usd: float
    annual_savings_usd: float
    confidence: float
    regret_risk: RegretRisk
    rank: int
    explanation: str                # plain language, shown in UI
    evidence: Evidence
    strategy: Strategy
    idempotency_key: str
    require_user_confirmation: bool = True

class SkippedStream(BaseModel):
    stream_id: str
    merchant: str
    reason: str

class ActionPlan(BaseModel):
    plan_id: str
    generated_at: str               # ISO datetime
    user_goal: str
    total_monthly_savings_usd: float
    total_annual_savings_usd: float
    actions: List[ActionItem]       # sorted by rank ascending
    skipped: List[SkippedStream]

# ─────────────────────────────────────────────
# LAYER 4 OUTPUT (Person 4 produces)
# ─────────────────────────────────────────────

class ActionEvidence(BaseModel):
    type: str                       # 'screenshot' | 'confirmation_id' | 'email'
    payload: dict                   # { path: str } or { id: str } or { body: str }

class ActionDetail(BaseModel):
    id: str
    recommendation_id: str
    merchant: str
    action_type: ActionType
    status: ActionStatus
    channel: Channel
    idempotency_key: str
    approved_at: Optional[str]
    executed_at: Optional[str]
    verified_at: Optional[str]
    evidence: List[ActionEvidence]
    monthly_savings_usd: float

class SavingsSummary(BaseModel):
    verified_monthly_usd: float
    pending_monthly_usd: float
    verified_annual_usd: float
    actions_succeeded: int
    actions_pending: int
    actions_failed: int
```

---

## API Contracts

### `POST /connect/mock`
**Owner**: Person 2
**Called by**: Person 1 (frontend connector screen)

Request:
```json
{ "source": "bank" | "gmail" | "slack" | "csv" | "demo" }
```
Response:
```json
{ "connection_id": "conn_abc123", "streams_loaded": 8 }
```

---

### `GET /recurring-streams`
**Owner**: Person 2
**Called by**: Person 1 (dashboard), Person 3 (agent plan)

Response:
```json
{
  "streams": [ RecurringStream, ... ],
  "total_monthly_usd": 4240.00,
  "stream_count": 12
}
```

---

### `POST /agent/plan`
**Owner**: Person 3
**Called by**: Person 1 (recommendations page)

Request:
```json
{ "user_goal": "Reduce my monthly spend" }
```
Response: `ActionPlan` (full object, see shared types above)

**Stub for Person 1 while Person 3 is building**:
```json
{
  "plan_id": "plan_stub_001",
  "generated_at": "2024-03-28T10:00:00Z",
  "user_goal": "Reduce my monthly spend",
  "total_monthly_savings_usd": 1870.00,
  "total_annual_savings_usd": 22440.00,
  "actions": [
    {
      "recommendation_id": "rec_001",
      "stream_id": "stream_001",
      "merchant": "Notion",
      "action_type": "cancel",
      "monthly_savings_usd": 320.00,
      "annual_savings_usd": 3840.00,
      "confidence": 0.91,
      "regret_risk": "low",
      "rank": 1,
      "explanation": "16 seats licensed, 0 logins in 90 days. Confluence is active for the same use case.",
      "evidence": {
        "last_login_days_ago": 97,
        "active_seat_count": 0,
        "total_seat_count": 16,
        "duplicate_tools": ["Confluence"],
        "benchmark_price_per_seat": 20,
        "sources": ["bank", "slack"]
      },
      "strategy": { "channel": "browser", "runbook_id": "notion_cancel_v1" },
      "idempotency_key": "cancel_notion_demo_stream_001",
      "require_user_confirmation": true
    }
  ],
  "skipped": [
    { "stream_id": "stream_slack", "merchant": "Slack", "reason": "Active usage, regret risk high" }
  ]
}
```

---

### `POST /agent/confirm`
**Owner**: Person 3
**Called by**: Person 1 (approve button)

Request:
```json
{ "recommendation_id": "rec_001", "approved_by": "user_demo" }
```
Response:
```json
{ "action_id": "act_xyz789" }
```

---

### `POST /agent/execute`
**Owner**: Person 4
**Called by**: Person 1 (after confirm, auto-triggered or button)

Request:
```json
{ "action_id": "act_xyz789" }
```
Response:
```json
{ "action_id": "act_xyz789", "status": "executing" }
```
(Status updates are polled via `GET /actions/{id}`)

---

### `GET /actions/{id}`
**Owner**: Person 4
**Called by**: Person 1 (status polling on `/actions/[id]` page)

Response: `ActionDetail` (see shared types)

**Stub for Person 1 while Person 4 is building**:
```json
{
  "id": "act_xyz789",
  "recommendation_id": "rec_001",
  "merchant": "Notion",
  "action_type": "cancel",
  "status": "succeeded",
  "channel": "browser",
  "idempotency_key": "cancel_notion_demo_stream_001",
  "approved_at": "2024-03-28T10:05:00Z",
  "executed_at": "2024-03-28T10:05:04Z",
  "verified_at": null,
  "evidence": [
    { "type": "confirmation_id", "payload": { "id": "NOT-2024-38291" } },
    { "type": "screenshot", "payload": { "path": "/evidence/act_xyz789.png" } }
  ],
  "monthly_savings_usd": 320.00
}
```

---

### `GET /savings/summary`
**Owner**: Person 4
**Called by**: Person 1 (dashboard savings widget)

Response: `SavingsSummary` (see shared types)

**Stub**:
```json
{
  "verified_monthly_usd": 320.00,
  "pending_monthly_usd": 480.00,
  "verified_annual_usd": 3840.00,
  "actions_succeeded": 1,
  "actions_pending": 2,
  "actions_failed": 0
}
```

---

## Stub Strategy

**Person 1 should not block on any other person.**
Use the stubs defined above as mock API responses (hardcode them in a `stubs.py` or as Next.js API route mocks) so the frontend can be built and tested independently.

When the real endpoint is ready:
1. Person who owns it pings the team in chat
2. Person 1 swaps the stub for the real endpoint call
3. Test the integration together

---

## DB Ownership

| Table | Written by | Read by |
|-------|-----------|---------|
| `recurring_streams` | Person 2 | Person 3 |
| `action_plans` | Person 3 | Person 1 (via endpoint) |
| `recommendations` | Person 3 | Person 1 (via endpoint), Person 4 |
| `actions` | Person 3 (creates), Person 4 (updates) | Person 1 (via endpoint) |
| `action_evidence` | Person 4 | Person 1 (via endpoint) |
| `audit_events` | All layers | Person 1 (audit log view, optional) |

---

## How to Sync During the Hackathon

1. **Start of each phase**: quick 5-min standup — what's done, what's blocked
2. **Integration points** (hours 6, 10, 14): both owners present, test together
3. **If an interface needs to change**: update this file first, then tell the team
4. **If you're blocked**: use the stub, keep building, flag it in chat

Each person should share this file with their AI assistant at the start of their session so it knows the full context of what you're building and how it connects.
