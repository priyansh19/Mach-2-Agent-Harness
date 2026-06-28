# Phase 2 — Harness

> Status: 🔲 Not started

**What this phase adds:** A central orchestrator that sits between the user and all agents. The user never talks to an agent directly — messages go Harness → Agent → Harness → User. The harness decides which agent handles a request and tracks the conversation state.

---

## What gets built

- `harness/orchestrator.py` — routes incoming requests to the right agent
- `harness/registry.py` — agent registry (maps names → agent instances)
- `server/main.py` — FastAPI server exposing `/chat` endpoint
- Langfuse traces now show harness routing as a parent span

---

<!-- ✅ Fill this section in when the phase is marked complete and pushed to GitHub -->

## How to replicate

> _Steps will be added here when Phase 2 is marked complete._

---

## What to verify in Langfuse

- **Parent span:** `harness.route` — shows which agent was selected
- **Child span:** the agent's ReAct loop from Phase 1
- Full request → route → agent → response visible as one trace

---

## Prerequisites

- Phase 1 complete and working
- FastAPI + Uvicorn installed (`pip install -r requirements.txt`)
- Run: `uvicorn server.main:app --reload --host 0.0.0.0 --port 8000`
