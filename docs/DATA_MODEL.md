# Data Model

Designed small but future-proof. Every table exists for a reason; nothing is premature.

---

## Core Tables

### `users`
```sql
users (
  id            TEXT PRIMARY KEY,   -- uuid
  email         TEXT UNIQUE,
  org_id        TEXT,               -- future: multi-tenant
  role          TEXT,               -- 'cfo' | 'ap' | 'it' | 'procurement'
  created_at    TIMESTAMP
)
```

### `connections`
One row per connected data source.
```sql
connections (
  id            TEXT PRIMARY KEY,
  user_id       TEXT REFERENCES users(id),
  org_id        TEXT,
  type          TEXT,               -- 'bank' | 'erp' | 'email' | 'saas' | 'cloud'
  status        TEXT,               -- 'active' | 'error' | 'pending'
  last_synced   TIMESTAMP,
  created_at    TIMESTAMP
)
```

### `recurring_streams`
The canonical spend object. Source-agnostic. This is the spend graph node.
```sql
recurring_streams (
  id            TEXT PRIMARY KEY,
  org_id        TEXT,
  merchant      TEXT,               -- normalized merchant name
  raw_merchant  TEXT,               -- original descriptor
  category      TEXT,               -- 'saas' | 'cloud' | 'media' | 'utility' | ...
  cadence       TEXT,               -- 'monthly' | 'annual' | 'quarterly'
  amount_usd    DECIMAL,
  seat_count    INTEGER,            -- null if not seat-based
  last_seen     DATE,
  first_seen    DATE,
  occurrence_count INTEGER,
  confidence    DECIMAL,            -- 0.0–1.0 recurring confidence
  usage_signal  TEXT,               -- 'active' | 'low' | 'none' | 'unknown'
  source        TEXT,               -- which connector found this
  notes         TEXT,               -- email snippets, invoice info
  is_protected  BOOLEAN DEFAULT FALSE,  -- IT can mark as never-touch
  created_at    TIMESTAMP
)
```

### `recommendations`
LLM-generated action proposals for each stream.
```sql
recommendations (
  id            TEXT PRIMARY KEY,
  org_id        TEXT,
  stream_id     TEXT REFERENCES recurring_streams(id),
  action_type   TEXT,               -- 'cancel' | 'downgrade' | 'negotiate' | 'switch'
  savings_usd   DECIMAL,            -- monthly savings estimate
  savings_annual DECIMAL,           -- annual savings estimate
  confidence    DECIMAL,            -- action confidence (different from stream confidence)
  regret_risk   TEXT,               -- 'low' | 'medium' | 'high'
  explanation   TEXT,               -- human-readable reasoning (shown in UI)
  evidence      JSON,               -- structured evidence: { usage, duplicates, benchmark }
  status        TEXT,               -- 'pending' | 'approved' | 'rejected' | 'deferred'
  plan_id       TEXT,               -- which ActionPlan this belongs to
  created_at    TIMESTAMP
)
```

### `action_plans`
A full LLM-generated plan for a user/org at a point in time.
```sql
action_plans (
  id            TEXT PRIMARY KEY,
  org_id        TEXT,
  user_goal     TEXT,               -- e.g., "reduce spend by $50K"
  total_savings_usd DECIMAL,        -- sum of all action savings
  action_count  INTEGER,
  raw_llm_output JSON,              -- full structured output from LLM
  created_at    TIMESTAMP
)
```

### `actions`
One row per execution attempt. Tied to an approved recommendation.
```sql
actions (
  id              TEXT PRIMARY KEY,
  org_id          TEXT,
  recommendation_id TEXT REFERENCES recommendations(id),
  tool_name       TEXT,             -- 'cancel_subscription' | 'negotiate_bill' | ...
  tool_args       JSON,             -- full tool call arguments
  idempotency_key TEXT UNIQUE,      -- vendor + account + action_type hash
  channel         TEXT,             -- 'api' | 'email' | 'browser' | 'phone'
  status          TEXT,             -- see state machine below
  approved_by     TEXT,             -- user_id
  approved_at     TIMESTAMP,
  executed_at     TIMESTAMP,
  verified_at     TIMESTAMP,
  created_at      TIMESTAMP
)
```

### `action_evidence`
Proof artifacts attached to an action.
```sql
action_evidence (
  id              TEXT PRIMARY KEY,
  action_id       TEXT REFERENCES actions(id),
  type            TEXT,             -- 'screenshot' | 'confirmation_email' | 'confirmation_id' | 'html'
  payload         JSON,             -- { url, text, path, ... }
  created_at      TIMESTAMP
)
```

### `audit_events`
Immutable log of every significant system event.
```sql
audit_events (
  id              TEXT PRIMARY KEY,
  org_id          TEXT,
  actor           TEXT,             -- user_id or 'system'
  event_type      TEXT,             -- see event types below
  object_type     TEXT,             -- 'action' | 'recommendation' | 'connection' | ...
  object_id       TEXT,
  payload         JSON,             -- full snapshot of relevant data
  created_at      TIMESTAMP
)
```

---

## Action State Machine

Every `action` row moves through these states:

```
                  ┌──────────┐
                  │ PROPOSED │  ← recommendation created, awaiting user
                  └────┬─────┘
                       │ user approves
                  ┌────▼─────┐
                  │ APPROVED │  ← approval recorded, queued for execution
                  └────┬─────┘
                       │ worker picks up
                  ┌────▼──────┐
                  │ EXECUTING │  ← in-flight (playwright, API call, email)
                  └────┬──────┘
              ┌─────────┴─────────┐
         success               failure
              │                   │
     ┌────────▼──────┐   ┌────────▼───────┐
     │   SUCCEEDED   │   │    FAILED      │
     └────────┬──────┘   └────────┬───────┘
              │                   │ retry / alternate channel
              │           ┌───────▼────────┐
              │           │ RETRY_QUEUED   │
              │           └───────┬────────┘
              │                   │
              │           ┌───────▼────────┐
              │           │  MANUAL_NEEDED │  ← escalate to human
              │           └────────────────┘
              │
     ┌────────▼──────────────┐
     │  VERIFIED / UNVERIFIED │  ← financial + vendor confirmation
     └────────┬──────────────┘
              │ user regrets
     ┌────────▼───────────┐
     │  ROLLBACK_REQUESTED│
     └────────────────────┘
```

---

## Audit Event Types

```
stream.detected
stream.protected
stream.unprotected
recommendation.created
recommendation.approved
recommendation.rejected
recommendation.deferred
action.queued
action.executing
action.succeeded
action.failed
action.verified
action.rollback_requested
policy.updated
connection.added
connection.error
```

---

## Seed Data (Hackathon)

Seed script creates 12 recurring streams covering varied scenarios:

| Merchant | Amount | Cadence | Usage | Category | Confidence |
|----------|--------|---------|-------|----------|------------|
| Notion | $320/mo | monthly | 0 logins 90d | saas | 0.91 |
| Figma | $180/mo | monthly | 3 of 10 seats active | saas | 0.85 |
| Zoom | $240/mo | monthly | overlap with Teams | saas | 0.72 |
| Adobe CC | $600/mo | monthly | 2 of 8 active | saas | 0.88 |
| AWS (dev) | $890/mo | monthly | overprovisioned | cloud | 0.65 |
| Slack | $1200/mo | monthly | active | saas | 0.10 |
| Asana | $280/mo | monthly | overlap with Jira | saas | 0.78 |
| Dropbox | $150/mo | monthly | overlap with Drive | saas | 0.80 |
| Webflow | $75/mo | monthly | last login 120d | saas | 0.93 |
| LinkedIn Sales Nav | $1600/mo | annual | 1 of 5 seats | saas | 0.70 |
| Heroku (staging) | $340/mo | monthly | low traffic | cloud | 0.60 |
| Loom | $120/mo | monthly | overlap with Zoom | saas | 0.82 |

Slack is always protected (confidence 0.10) — used to demonstrate the "do not touch" logic.
