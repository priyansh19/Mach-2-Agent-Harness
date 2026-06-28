# Phase 3 — Agent-to-Agent

> Status: 🔲 Not started

**What this phase adds:** Agents can call other agents as tools. The orchestrator exposes a `spawn_scout(mission, tools, budget)` function. When a primary agent needs sub-research, it spawns a scout agent, gets its report, and continues its own ReAct loop. Nested ReAct loops inside a harness.

---

## What gets built

- `tools/spawn_scout.py` — agent-as-tool wrapper
- `harness/spawner.py` — lifecycle management for spawned agents (limit, timeout, dedup)
- Scout agents run their own isolated ReAct loops and return structured JSON
- Langfuse traces show parent agent → child scout as nested spans

---

<!-- ✅ Fill this section in when the phase is marked complete and pushed to GitHub -->

## How to replicate

> _Steps will be added here when Phase 3 is marked complete._

---

## What to verify in Langfuse

- A primary agent trace with `spawn_scout` as a tool call span
- Inside that span, a nested scout trace (its own Thought → Action → Observation chain)
- Scout result surfaced back to the parent agent's context

---

## Prerequisites

- Phase 2 complete and working
- Harness server running on port 8000
