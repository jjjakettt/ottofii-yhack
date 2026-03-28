# Ottofii — AI Cost Optimization Agent

> Autonomous agent platform that detects recurring spend, identifies savings opportunities, and executes cancellation/downgrade/renegotiation actions — with human-in-the-loop controls.

## What We're Building

**Detect → Decide → Act → Verify**

An AI agent that:
1. Ingests financial data (transactions, invoices, SaaS usage)
2. Detects recurring/wasteful spend patterns
3. Generates a ranked, structured action plan
4. Executes actions (cancel, downgrade, renegotiate) with user approval
5. Verifies outcomes and tracks verified savings

## Docs

| Doc | Purpose |
|-----|---------|
| [HACKATHON_PLAN.md](docs/HACKATHON_PLAN.md) | 24-hour execution plan, priorities, task breakdown |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, component responsibilities |
| [USER_FLOWS.md](docs/USER_FLOWS.md) | Enterprise persona flows (CFO, AP, IT, Procurement) |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Core data schema, action state machine |
| [ACTION_ENGINE.md](docs/ACTION_ENGINE.md) | Tool schemas, JSON action plan format, execution logic |

## Tech Stack (Hackathon)

- **Frontend**: Next.js (App Router) + Tailwind
- **Backend**: FastAPI (Python)
- **DB**: SQLite → Postgres (schema-first, migration-ready)
- **LLM**: Claude claude-sonnet-4-6 with structured outputs + tool calling
- **Automation**: Playwright (against our own demo portal)
- **Data**: Seeded mock transactions + sandbox mode toggle

## Core Principle

> LLMs are a commodity. Execution + data is the moat.

This is not a dashboard. It is a system that *acts*.
