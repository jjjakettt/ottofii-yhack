# Action Engine

The action engine is what separates Ottofii from a dashboard. It *executes*.

---

## LLM Prompt Design

### System Prompt
```
You are Ottofii, an autonomous cost optimization agent for enterprise spend.
Your job is to analyze recurring spend streams and produce a ranked action plan.

You MUST:
- Output valid JSON matching the ActionPlan schema exactly
- Include specific evidence for every action (usage data, dates, amounts)
- Rank actions by net savings score (savings × confidence × (1 - regret_risk))
- Explain each action in plain language that a finance team can act on

You MUST NOT:
- Propose actions on: payroll, rent, mortgage, insurance, utilities, medical, taxes
- Propose actions on streams marked is_protected = true
- Invent data not present in the input
- Produce free-form text outside the JSON schema

For every action, apply:
- regret_risk = "high" if: category is production tool, confidence < 0.6, or is_protected
- regret_risk = "medium" if: confidence 0.6–0.75 or usage_signal = "unknown"
- regret_risk = "low" if: confidence > 0.75 and usage_signal in ("none", "low")

Require confirmation for all actions. Set require_user_confirmation = true unless
the action is marked auto_executable in the org policy.
```

### User Message (constructed server-side)
```
User goal: "Reduce monthly recurring spend. Focus on unused and duplicate tools."

Org context:
- Company: Acme Corp
- Team size: 120 employees
- Policy: auto-cancel allowed for tools under $2,000/year with usage_signal = "none"

Recurring streams (JSON):
[
  {
    "id": "stream_001",
    "merchant": "Notion",
    "category": "saas",
    "cadence": "monthly",
    "amount_usd": 320,
    "seat_count": 16,
    "usage_signal": "none",
    "confidence": 0.91,
    "notes": "0 logins in last 90 days. Confluence also active.",
    "is_protected": false
  },
  ...
]

Return an ActionPlan JSON object.
```

---

## ActionPlan Schema

```json
{
  "plan_id": "plan_acme_2024_03_28",
  "generated_at": "2024-03-28T10:00:00Z",
  "user_goal": "Reduce monthly recurring spend",
  "total_monthly_savings_usd": 1625,
  "total_annual_savings_usd": 19500,
  "actions": [
    {
      "stream_id": "stream_001",
      "merchant": "Notion",
      "action_type": "cancel",
      "monthly_savings_usd": 320,
      "annual_savings_usd": 3840,
      "confidence": 0.91,
      "regret_risk": "low",
      "rank": 1,
      "explanation": "16 seats licensed, 0 logins in 90 days. Confluence is active for the same use case. Cancellation is low-risk.",
      "evidence": {
        "last_login_days_ago": 97,
        "active_seat_count": 0,
        "total_seat_count": 16,
        "duplicate_tools": ["Confluence"],
        "benchmark_price_per_seat": 20
      },
      "strategy": {
        "channel": "browser",
        "runbook_id": "notion_cancel_v1",
        "fallback_channel": "email",
        "email_template_id": "saas_cancel_standard"
      },
      "constraints": {
        "max_cancellation_fee_usd": 0,
        "require_user_confirmation": true,
        "deadline_iso": null
      },
      "idempotency_key": "cancel_notion_acme_stream_001"
    }
  ],
  "skipped": [
    {
      "stream_id": "stream_slack",
      "merchant": "Slack",
      "reason": "usage_signal = active, confidence = 0.10, regret_risk = high"
    }
  ]
}
```

---

## Tool Schemas

These are the tools the LLM can propose. Your execution layer implements each one.

### `cancel_subscription`
```json
{
  "name": "cancel_subscription",
  "description": "Cancel a subscription or recurring service. Requires user confirmation unless org policy allows auto-execution.",
  "parameters": {
    "type": "object",
    "required": ["stream_id", "merchant_name", "strategy", "idempotency_key"],
    "properties": {
      "stream_id": { "type": "string" },
      "merchant_name": { "type": "string" },
      "account_hint": { "type": "string", "description": "Email domain or last-4 of card on file" },
      "strategy": {
        "type": "object",
        "required": ["channel"],
        "properties": {
          "channel": { "type": "string", "enum": ["api", "email", "browser", "phone"] },
          "runbook_id": { "type": "string" },
          "email_template_id": { "type": "string" },
          "fallback_channel": { "type": "string", "enum": ["api", "email", "browser", "phone"] }
        }
      },
      "constraints": {
        "type": "object",
        "properties": {
          "max_cancellation_fee_usd": { "type": "number" },
          "deadline_iso": { "type": "string" },
          "require_user_confirmation": { "type": "boolean", "default": true }
        }
      },
      "idempotency_key": { "type": "string" }
    }
  }
}
```

### `downgrade_subscription`
```json
{
  "name": "downgrade_subscription",
  "description": "Reduce seat count or move to a lower tier plan.",
  "parameters": {
    "type": "object",
    "required": ["stream_id", "merchant_name", "target_seats", "idempotency_key"],
    "properties": {
      "stream_id": { "type": "string" },
      "merchant_name": { "type": "string" },
      "current_seats": { "type": "integer" },
      "target_seats": { "type": "integer" },
      "current_tier": { "type": "string" },
      "target_tier": { "type": "string" },
      "monthly_savings_usd": { "type": "number" },
      "idempotency_key": { "type": "string" }
    }
  }
}
```

### `negotiate_bill`
```json
{
  "name": "negotiate_bill",
  "description": "Attempt to lower a recurring bill by switching plan or requesting retention offer. Always requires explicit approval.",
  "parameters": {
    "type": "object",
    "required": ["stream_id", "vendor_name", "target_monthly_usd", "channel", "idempotency_key"],
    "properties": {
      "stream_id": { "type": "string" },
      "vendor_name": { "type": "string" },
      "service_type": { "type": "string", "enum": ["saas", "cloud", "internet", "mobile", "other"] },
      "target_monthly_usd": { "type": "number" },
      "benchmark_price_usd": { "type": "number" },
      "must_keep_features": { "type": "array", "items": { "type": "string" } },
      "channel": { "type": "string", "enum": ["phone", "browser", "email"] },
      "idempotency_key": { "type": "string" }
    }
  }
}
```

### `refund_request`
```json
{
  "name": "refund_request",
  "description": "Generate and send a refund request (unused period, double charge, canceled-but-billed).",
  "parameters": {
    "type": "object",
    "required": ["stream_id", "merchant_name", "evidence", "channel", "idempotency_key"],
    "properties": {
      "stream_id": { "type": "string" },
      "merchant_name": { "type": "string" },
      "evidence": {
        "type": "object",
        "required": ["charge_ids", "narrative"],
        "properties": {
          "charge_ids": { "type": "array", "items": { "type": "string" } },
          "narrative": { "type": "string" },
          "attachments": { "type": "array", "items": { "type": "string" } }
        }
      },
      "channel": { "type": "string", "enum": ["email", "browser", "api"] },
      "idempotency_key": { "type": "string" }
    }
  }
}
```

---

## Execution Flow

```
POST /agent/confirm  { recommendation_id, approved_by }
     │
     ├─ validate policy (category blocklist, is_protected, thresholds)
     ├─ write action row: status = APPROVED
     └─ return { action_id }

POST /agent/execute  { action_id }
     │
     ├─ check idempotency_key (if exists + SUCCEEDED → return early)
     ├─ update status → EXECUTING
     ├─ dispatch to executor based on channel:
     │    'browser' → playwright_executor(runbook_id, args)
     │    'email'   → email_executor(template_id, args)
     │    'api'     → vendor_api_executor(vendor, args)
     ├─ on success:
     │    update status → SUCCEEDED
     │    store evidence (confirmation_id, screenshot)
     └─ on failure:
          update status → FAILED
          if retryable → queue RETRY
          else → MANUAL_NEEDED, notify user
```

---

## Playwright Demo Executor (Hackathon)

For the hackathon, execute against our own demo portal instead of real vendors.

### Demo Portal Routes
```
GET  /demo/login                → email + password form
GET  /demo/subscriptions        → list of subscriptions with Cancel buttons
POST /demo/cancel/:id           → triggers confirmation step
GET  /demo/confirm-cancel       → shows what will be cancelled
POST /demo/confirm-cancel       → executes cancellation
GET  /demo/receipt              → shows confirmation_id
```

### Playwright Script
```typescript
// scripts/executors/browser_cancel.ts
import { chromium } from "playwright";

export async function browserCancel(opts: {
  portalUrl: string;
  email: string;
  password: string;
  subscriptionId: string;
}): Promise<{ confirmationId: string; screenshotPath: string }> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto(`${opts.portalUrl}/login`);
  await page.fill('input[name="email"]', opts.email);
  await page.fill('input[name="password"]', opts.password);
  await page.click('button[type="submit"]');

  // Navigate to subscriptions
  await page.goto(`${opts.portalUrl}/subscriptions`);

  // Click cancel for target subscription
  await page.click(`button[data-subscription-id="${opts.subscriptionId}"][data-action="cancel"]`);

  // Confirm cancellation
  await page.waitForURL("**/confirm-cancel");
  await page.click('button[data-action="confirm"]');

  // Capture proof
  await page.waitForURL("**/receipt");
  const confirmationId = await page.textContent('[data-field="confirmation_id"]');
  const screenshotPath = `evidence/${opts.subscriptionId}_${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath });

  await browser.close();
  return { confirmationId: confirmationId!, screenshotPath };
}
```

---

## Scoring Algorithm

For each stream, compute a composite score to rank the action plan:

```python
def score_action(stream, recommendation):
    # Savings potential (normalized 0-1 against max in dataset)
    savings_score = recommendation.monthly_savings_usd / max_savings

    # How confident we are this is recurring and wasteful
    confidence = stream.confidence

    # How likely user regrets cancellation (inverse)
    regret_map = {"low": 0.1, "medium": 0.4, "high": 0.8}
    regret_penalty = regret_map[recommendation.regret_risk]

    # Can we actually execute this?
    feasibility = 0.9 if runbook_exists(stream.merchant) else 0.5

    composite = savings_score * confidence * (1 - regret_penalty) * feasibility
    return composite

# Sort actions by composite score descending
ranked_actions = sorted(actions, key=score_action, reverse=True)
```

---

## Idempotency

Every action has a stable `idempotency_key` derived from:
```python
key = f"cancel_{merchant}_{org_id}_{stream_id}"
```

Before execution:
1. Check if a `SUCCEEDED` action with this key already exists
2. If yes → return existing evidence (do not re-execute)
3. If no → proceed with execution

This makes retries safe and prevents double-cancellations.
