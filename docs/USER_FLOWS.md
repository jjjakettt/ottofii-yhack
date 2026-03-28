# User Flows

Ottofii serves four enterprise personas. Each has a different goal, different level of access, and different interaction pattern with the system.

---

## Persona 1 — CFO / Finance Leader (Strategic)

**Goal**: Visibility + control over total recurring spend. Make high-level policy decisions.

```
┌─────────────────────────────────────────────────┐
│  CFO FLOW                                       │
│                                                 │
│  1. Connect systems                             │
│     ERP · Corporate cards · SaaS inventory      │
│                                                 │
│  2. See dashboard                               │
│     "$2.3M annual savings identified"           │
│     Breakdown: waste / underutilization /       │
│                vendor overlap                   │
│                                                 │
│  3. Drill into categories                       │
│     "SaaS: 14 unused tools ($480K)"             │
│     "Cloud: overprovisioned ($210K)"            │
│     "Contracts: 3 up for renewal ($590K)"       │
│                                                 │
│  4. Set automation policy                       │
│     "Auto-cancel tools < $5K/year"              │
│     "Flag contracts > $50K for review"          │
│     "Never touch: AWS prod, Salesforce, Okta"   │
│                                                 │
│  5. View realized savings over time             │
│     Verified · Pending · Rejected               │
└─────────────────────────────────────────────────┘
```

**Output**: Org-wide policy configuration + executive savings report

**Key UI elements**: Savings dashboard, policy editor, category drill-down

---

## Persona 2 — Finance / AP Team (Operators)

**Goal**: Review and execute AI recommendations. Handle day-to-day spend optimization.

```
┌─────────────────────────────────────────────────┐
│  AP TEAM FLOW                                   │
│                                                 │
│  1. Open action inbox                           │
│     AI-generated recommendations queue          │
│                                                 │
│  2. Review recommendation                       │
│     "Notion — 16 seats, 0 logins 90 days"       │
│     "$320/month · confidence: 87%"              │
│     Evidence: usage chart, purchase history,    │
│               similar tools detected            │
│                                                 │
│  3. Approve / reject / defer                    │
│     One-click approve                           │
│     Batch approve (low-risk category)           │
│     Add note for audit trail                    │
│                                                 │
│  4. Watch execution                             │
│     Status: Queued → Executing → Succeeded      │
│     Proof: confirmation ID / screenshot         │
│                                                 │
│  5. Track outcomes                              │
│     Savings realized this month                 │
│     Actions pending verification                │
│     Failed actions needing manual follow-up     │
└─────────────────────────────────────────────────┘
```

**Output**: Executed cancellations/downgrades + savings tracking

**Key UI elements**: Recommendation inbox, approval modal, action status, evidence view

---

## Persona 3 — IT / Engineering (Guardrails)

**Goal**: Prevent AI from touching critical infrastructure or production tools.

```
┌─────────────────────────────────────────────────┐
│  IT FLOW                                        │
│                                                 │
│  1. View SaaS inventory with usage signals      │
│     Tool · Owner team · Monthly cost · Logins   │
│                                                 │
│  2. Set tool constraints                        │
│     "Mark as protected": AWS, GitHub, PagerDuty │
│     Protected tools never appear in AI queue    │
│                                                 │
│  3. Review technical action proposals           │
│     "Downsize EC2 instance class"               │
│     Must approve before execution               │
│                                                 │
│  4. See integration health                      │
│     Connector status · Last sync                │
│     Data freshness per source                   │
└─────────────────────────────────────────────────┘
```

**Output**: Protected tool list + technical action approvals

**Key UI elements**: Tool inventory, protection flags, integration status dashboard

---

## Persona 4 — Procurement (Vendor Optimization)

**Goal**: Reduce vendor costs through renegotiation, consolidation, and switching.

```
┌─────────────────────────────────────────────────┐
│  PROCUREMENT FLOW                               │
│                                                 │
│  1. See vendor intelligence                     │
│     "Paying $X for Figma — market rate $Y"      │
│     "3 overlapping project management tools"    │
│                                                 │
│  2. Review AI suggestions                       │
│     "Consolidate to one PM tool: save $18K/yr"  │
│     "Renegotiate Salesforce at renewal"         │
│     AI provides: benchmark pricing, scripts     │
│                                                 │
│  3. Generate negotiation assets                 │
│     Draft renegotiation email                   │
│     Competitive pricing benchmarks              │
│     Talking points for vendor call              │
│                                                 │
│  4. Track vendor actions                        │
│     Negotiations in progress                    │
│     Renewals coming up (30/60/90 day view)      │
└─────────────────────────────────────────────────┘
```

**Output**: Renegotiation scripts + vendor consolidation recommendations

**Key UI elements**: Vendor overlap view, renewal calendar, negotiation assistant

---

## Consumer Flow (Extension, Same Backend)

```
┌─────────────────────────────────────────────────┐
│  CONSUMER FLOW                                  │
│                                                 │
│  1. Connect bank (Plaid) or upload CSV          │
│                                                 │
│  2. See subscription summary                    │
│     "You're paying $340/month in subscriptions" │
│     "We think you can save $120/month"          │
│                                                 │
│  3. Review per-subscription                     │
│     Last used · Cost · Recommendation           │
│                                                 │
│  4. One-click approve cancel                    │
│                                                 │
│  5. See confirmation + savings tracker          │
└─────────────────────────────────────────────────┘
```

Same backend, simpler UX, no approval routing, no policy engine complexity.

---

## Safe Mode vs Autonomous Mode (All Personas)

```
SAFE MODE (default)
──────────────────
AI detects → proposes action + explains → user approves → executes → verifies
Every action requires a human decision. Full audit trail.

AUTONOMOUS MODE (enterprise, policy-scoped)
───────────────────────────────────────────
AI detects → policy check → auto-execute if within thresholds → verify → notify
Example: "Auto-cancel tools under $2K/year with 0 logins for 90 days"
Requires: explicit policy config, approval gates for edge cases, kill switches
```

Autonomous mode is the premium differentiator — where Ottofii becomes an operator, not just a dashboard.
