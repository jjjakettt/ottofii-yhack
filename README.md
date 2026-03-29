# Ottofii — AI Cost Optimization Agent

> **Autonomous agent platform for enterprises that detects recurring spend, identifies savings opportunities, and executes cancellation/downgrade/renegotiation actions with human-in-the-loop controls.**

**Try it:** https://github.com/jjjakettt/ottofii-yhack

---

## Inspiration

The average company spends **$49M–$55M annually on SaaS**, with large enterprises spending $123M–$375M+. Yet **30–50% of this spend is wasted** — unused licenses, duplicates, forgotten renewals — and 77–78% of companies report unexpected charges (Zylo, TechRadar).

The problem isn't awareness. It's execution. Canceling subscriptions requires logging into portals, calling support lines, navigating retention offers, and collecting confirmation numbers. Nobody does it. We built a system that does.

---

## What It Does

**Detect → Decide → Act → Verify**

**Detect:** Ottofii analyzes your financial signals — bank transactions, email receipts, SaaS usage — and identifies recurring charges using deterministic cadence detection and merchant normalization.

**Decide:** Ottofii analyzes every detected stream against your usage patterns and generates a ranked action plan with plain-English reasoning: *"You haven't used Notion in 32 days. Canceling saves you $155/year."*

**Act:** With one click to approve, Ottofii executes automatically via multi-channel automation: browser, email, or an AI-powered phone agent (ElevenLabs + Twilio) that handles retention offers and verification on your behalf.

**Verify:** Every completed action produces proof — a confirmation ID, screenshot, and call transcript — stored in a full audit trail.

---

## Demo Walkthrough

### Landing Page

![Landing page — hero](frontend/screenshots/landing_page_1.png)
*Hero: "The SaaS cleanup you've been putting off for months." — $48/employee/month average waste. One-click to start.*

![Landing page — before vs. after](frontend/screenshots/landing_page_2.png)
*Before vs. After: Finding subscriptions manually vs. Ottofii scanning bank, Gmail, and ERP automatically. Cancelling via 15-step hold music vs. Ottofii navigating the flow or calling support.*

![Landing page — features](frontend/screenshots/landing_page_3.png)
*Live agent activity log, "finds what you forgot" data connectors, and ranks by actual impact — usage signals, seat counts, and regret-risk.*

---

### Onboarding (8 steps)

![Onboarding step 1 — welcome](frontend/screenshots/onboarding_1.png)
*Step 1: Welcome screen — outlines the three-step process: connect data sources, review AI recommendations, approve or let Ottofii execute.*

![Onboarding step 2 — company info](frontend/screenshots/onboarding_2.png)
*Step 2: Company profile — name, industry, and size so Ottofii can tailor recommendations to your scale.*

![Onboarding step 3 — create account](frontend/screenshots/onboarding_3.png)
*Step 3: Account creation — name and work email. Any values work for the demo.*

![Onboarding step 4 — connect data sources (OAuth)](frontend/screenshots/onboarding_4.png)
*Step 4: Connect data sources — Gmail, Slack, Bank/Cards, CSV upload, or QuickBooks. OAuth permission prompt shown for Gmail.*

![Onboarding step 4 — data sources connected](frontend/screenshots/onboarding_5.png)
*Step 4 (continued): Gmail and Bank/Cards connected. At least one source required; more can be added later.*

![Onboarding step 5 — analysis complete](frontend/screenshots/onboarding_6.png)
*Step 5: Analysis complete — Ottofii found 13 recurring subscriptions across connected sources.*

![Onboarding step 6 — goals](frontend/screenshots/onboarding_7.png)
*Step 6: Goals selection — Reduce SaaS spend, Eliminate unused tools, Renegotiate contracts, Consolidate vendors. Ottofii prioritizes recommendations accordingly.*

![Onboarding step 7 — agent mode](frontend/screenshots/onboarding_8.png)
*Step 7: Agent mode — Safe mode (you approve every action) vs. Autonomous mode (Ottofii executes within policy, you review the audit log). Legal contracts, payroll, and tax obligations are always protected.*

![Onboarding step 8 — all set](frontend/screenshots/onboarding_9.png)
*Step 8: Setup complete — company, sources connected, goals, and agent mode confirmed. Ready to view the dashboard.*

---

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
*Otto calculates potential savings across all detected subscriptions — typically completes in a few seconds.*

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

When browser automation isn't available for a vendor, Otto falls back to making a real phone call. Otto acts as a voice agent, navigates the support line, handles retention offers, and extracts the confirmation number from the conversation.

![Phone cancellation — success](frontend/screenshots/phone_success.png)
*Notion cancelled via phone call — $320/mo saved. Browser automation failed and Otto automatically fell back to a live phone cancellation.*

![Phone proof of completion](frontend/screenshots/phone_proof_of_completion.png)
*Proof of completion for the phone cancellation: fallback reason, vendor line called, and confirmation number XY042 extracted from the call.*

![Phone call transcript](frontend/screenshots/phone_convo.png)
*Full 12-turn conversation transcript — Otto calls the vendor, handles retention offers ("we have discounts..."), and confirms the cancellation number.*

---

### 8. Completed Actions — Rejected

Any recommendations you reject are tracked in the Completed tab, so you have a full audit trail of every decision made.

![Rejected recommendations](frontend/screenshots/recs_rejected.png)
*Completed tab showing rejected actions (AWS downgrade and Loom cancellation) alongside $1,010/mo in realized savings from approved actions.*

---

## How We Built It

We split the system into four ownership layers with strict API contracts defined upfront in a shared `TEAM.md`. This let everyone build in parallel without blocking each other.

**Frontend:** Next.js 14 (App Router + TypeScript), React 19, TanStack Query, shadcn/ui.

**Detection Layer:** Python + FastAPI — deterministic rules for merchant normalization, cadence detection (monthly/annual/quarterly), confidence scoring, and blocklisting of payroll, rent, and other protected categories.

**Intelligence Layer:** Before calling any LLM, we pre-score each subscription deterministically based on monthly equivalent spend, savings rank, and regret risk — so the model only handles explanation and prioritization. We use OpenAI `gpt-4o-mini` with JSON mode for structured output, with automatic fallback to Google Gemini 2.0 Flash if OpenAI fails. The response is validated on our end: hallucinated stream IDs are stripped, savings are capped at actual spend, and duplicates are removed before the plan is returned.

**Execution Layer:** Two channels. Playwright automates our demo cancellation portal for browser-based flows, capturing a confirmation ID and screenshot as proof. For merchants requiring a phone call, we integrated ElevenLabs Conversational AI with Twilio to make real outbound calls. The voice agent handles the full conversation including retention offers, and we parse the transcript to extract the confirmation number. Users can abort a live call from the UI at any point.

**Database:** SQLAlchemy ORM backed by Supabase (PostgreSQL). Seven tables covering the full lifecycle — detected subscriptions, LLM-generated plans, recommendations, an action state machine (`proposed → approved → executing → succeeded/failed`), proof artifacts, and a full audit log. Every action carries an idempotency key to prevent double-cancellations on retries.

---

## Challenges

**ElevenLabs conversation polling:** Detecting when a voice call completed and extracting the confirmation number from the transcript required normalizing spoken numbers ("three four seven" → `347`), handling variable transcript formats, and building a polling mechanism that didn't time out prematurely.

**Demo portal automation:** Rather than fighting real vendor CAPTCHAs and 2FA, we built a realistic fake cancellation portal with the same UX shape and `data-attributes` for Playwright to target.

**Parallel development under time pressure:** Four people building four layers simultaneously meant any interface mismatch would cascade. Writing shared Pydantic schemas and a strict API contract doc before touching implementation code saved us from integration chaos at the end.

---

## Accomplishments

**An end-to-end loop that actually works:** The full flow — connect → detect → plan → approve → execute → confirmation number + screenshot — runs without manual intervention. Watching Otto call a phone number, navigate a retention offer, and return a confirmation ID was the moment the project became real.

**AI that calls people:** Most hackathon projects demo a chat interface. Ours makes outbound phone calls. The ElevenLabs + Twilio integration handles live conversations, adapts to whatever the support rep says, and parses the result.

---

## What We Learned

**Separate deterministic logic from LLM logic.** When the model was responsible for calculations or pattern detection, results were inconsistent. Pre-scoring the data before sending it to the model — and validating output afterward — made the system far more reliable.

**Team contracts matter as much as code.** Writing down shared types and API shapes before anyone wrote implementation code meant four people could build in parallel and integrate cleanly at the end. At a hackathon, that's the difference between a working demo and a merge conflict disaster.

---

## What's Next

- **Real data connectors:** OAuth integrations with Gmail and Plaid to replace mock data with live transactions and email receipts.
- **Free trial watcher:** Detect trial start dates and auto-cancel before the first charge hits.
- **Individual tier:** The same engine applied to personal subscriptions.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| UI Components | React 19 + TanStack Query + shadcn/ui |
| Backend | FastAPI (Python) |
| Database | SQLAlchemy + Supabase (PostgreSQL) |
| LLM | OpenAI gpt-4o-mini + Google Gemini 2.0 Flash (fallback) |
| Browser Automation | Playwright |
| Voice Agent | ElevenLabs Conversational AI + Twilio |

**Built with:** `python` `next.js` `supabase` `sqlalchemy` `typescript` `react` `fastapi` `postgresql` `openai` `gemini` `elevenlabs` `twilio` `playwright`

---

## Docs

| Doc | Purpose |
|-----|---------|
| [HACKATHON_PLAN.md](docs/HACKATHON_PLAN.md) | 24-hour execution plan, priorities, task breakdown |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, component responsibilities |
| [USER_FLOWS.md](docs/USER_FLOWS.md) | Enterprise persona flows (CFO, AP, IT, Procurement) |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Core data schema, action state machine |
| [ACTION_ENGINE.md](docs/ACTION_ENGINE.md) | Tool schemas, JSON action plan format, execution logic |
