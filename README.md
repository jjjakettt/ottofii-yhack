# Ottofii — AI Cost Optimization Agent

> Autonomous agent platform that detects recurring SaaS spend, identifies savings opportunities, and executes cancellation/downgrade/renegotiation actions — with human-in-the-loop controls.

---

## What It Does

**Detect → Decide → Act → Verify**

Ottofii is an AI agent that:

1. **Detects** recurring and wasteful SaaS spend across your organization
2. **Analyzes** usage patterns and generates a ranked action plan
3. **Executes** cancellations, downgrades, and renegotiations — via browser automation or phone calls
4. **Verifies** outcomes with proof of completion (confirmation IDs, screenshots, call transcripts)

> LLMs are a commodity. Execution + data is the moat. This is not a dashboard — it is a system that *acts*.

---

## Demo Walkthrough

### 1. Spend Dashboard

The dashboard gives a real-time view of all detected subscriptions, their billing cadence, seat count, usage levels, and Otto's confidence in each detection.

![Dashboard](frontend/screenshots/dashboard.png)
*The main dashboard showing $4,528/mo across 12 detected subscriptions — with $890/mo in pending savings awaiting execution.*

---

### 2. Recommendations — Before Generation

Before Otto runs its analysis, the Recommendations page prompts you to kick off the AI savings scan.

![Recommendations empty state](frontend/screenshots/recs_empty_state.png)
*Clean empty state prompting the user to trigger Otto's savings analysis.*

---

### 3. Recommendations — Generating

Otto analyzes every subscription against usage, seat count, and contract data in real time.

![Generating recommendations](frontend/screenshots/recs_generation.png)
*Claude calculates potential savings across all detected subscriptions — typically completes in a few seconds.*

---

### 4. Recommendations — AI Action Plan

Otto surfaces a prioritized list of actions: cancel underused tools, downgrade oversized plans, or renegotiate contracts — each with a confidence score and regret-risk label.

![Generated recommendations](frontend/screenshots/recs_generated.png)
*Otto identified $1,930/mo ($23,160/yr) in savings: AWS downgrade ($890/mo), Adobe Creative Cloud downgrade ($600/mo), Notion cancellation ($320/mo), and Loom cancellation ($120/mo).*

---

### 5. Human-in-the-Loop Approval

You stay in control. Select individual recommendations or bulk-approve/reject the entire plan before Otto executes anything.

![Multi-select approval](frontend/screenshots/recs_multi_select.png)
*Bulk approval flow — 2 actions selected with one click, ready to approve or reject together.*

---

### 6. Execution — Browser Automation (Zoom)

For vendors with supported portals, Otto uses browser automation to execute cancellations directly. Every action produces auditable proof of completion.

![Approved action — execution detail](frontend/screenshots/approved_1.png)
*Zoom cancellation succeeded via browser automation — $240/mo saved, with a confirmation ID and full execution timeline.*

![Approved action — proof of completion](frontend/screenshots/approved_2.png)
*Proof of completion: a screenshot captured from the Zoom vendor portal confirming the subscription was cancelled (Confirmation ID: Z00-012263-_003).*

---

### 7. Execution — Phone Call Fallback (Notion)

When browser automation isn't available for a vendor, Otto falls back to making a real phone call. Otto acts as a voice agent, navigates the support line, and extracts the confirmation number from the conversation.

![Phone cancellation — success](frontend/screenshots/phone_success.png)
*Notion cancelled via phone call — $320/mo saved. Browser automation failed and Otto automatically fell back to a live phone cancellation.*

![Phone proof of completion](frontend/screenshots/phone_proof_of_completion.png)
*Proof of completion for the phone cancellation: fallback reason, vendor line called, and confirmation number XY042 extracted from the call.*

![Phone call transcript](frontend/screenshots/phone_convo.png)
*Full 12-turn conversation transcript — Otto calls the vendor, handles retention offers ("we have discounts..."), and confirms the cancellation number.*

---

### 8. Completed Actions — Rejected

Any recommendations you reject are tracked in the Completed tab with their status, so you have a full audit trail of every decision made.

![Rejected recommendations](frontend/screenshots/recs_rejected.png)
*Completed tab showing rejected actions (AWS downgrade and Loom cancellation) alongside $1,010/mo in realized savings from approved actions.*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | SQLite → Postgres (migration-ready) |
| LLM | Openai API & Google Gemini API — structured outputs + tool calling |
| Browser Automation | Playwright (against vendor demo portals) |
| Voice Agent | ElevenLabs conversational AI — phone call execution + confirmation extraction |
| Data | Seeded mock transactions + sandbox mode |

---

## Architecture

```
Transactions / Invoices
        ↓
  Subscription Detection (Openai / Gemini)
        ↓
  Action Plan Generation (Openai / Gemini)
        ↓
  Human Approval (UI)
        ↓
  Execution Engine
    ├── Browser Automation (Playwright)
    └── Phone Call Agent (ElevenLabs)
        ↓
  Proof of Completion + Savings Tracking
```

---

## Docs

| Doc | Purpose |
|-----|---------|
| [HACKATHON_PLAN.md](docs/HACKATHON_PLAN.md) | 24-hour execution plan, priorities, task breakdown |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, component responsibilities |
| [USER_FLOWS.md](docs/USER_FLOWS.md) | Enterprise persona flows (CFO, AP, IT, Procurement) |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Core data schema, action state machine |
| [ACTION_ENGINE.md](docs/ACTION_ENGINE.md) | Tool schemas, JSON action plan format, execution logic |
