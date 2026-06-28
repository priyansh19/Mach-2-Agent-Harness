# Phase 4 — Specialization

> Status: 🔲 Not started

**What this phase adds:** Three dedicated agents with distinct roles replacing the generic agent from Phase 1. The Research Agent is itself a nested harness — it orchestrates scouting agents in parallel. The Critic runs a multi-layer pipeline (Fact → Gap → Logic → Efficiency → Sign-off). The Synthesizer writes the final user-facing answer from the approved critique ledger.

---

## What gets built

### Research Agent (L0–L1)
- `agents/research/orchestrator.py` — decomposes the mission, spawns scouts
- `agents/research/synthesizer.py` — merges scout reports into one research report
- Scout briefs: `{ mission, sources[], query, budget, timeout }`

### Critic Pipeline (L2–L7)
- `agents/critic/fact.py` — checks sources, recency, cross-scout conflicts
- `agents/critic/gap.py` — flags missing dimensions, recommends re-scouts
- `agents/critic/logic.py` — scope fit, internal consistency
- `agents/critic/efficiency.py` — cuts redundancy, trims verbosity
- `agents/critic/signoff.py` — approves or requests revision (max N rounds)

### Synthesizer Agent (L6)
- `agents/synthesizer.py` — writes final answer from critique ledger

---

<!-- ✅ Fill this section in when the phase is marked complete and pushed to GitHub -->

## How to replicate

> _Steps will be added here when Phase 4 is marked complete._

---

## What to verify in Langfuse

- Research trace: orchestrator → N parallel scouts → synthesizer
- Critic trace: L2 → L3 → (optional re-scout) → L4 → L5 → L7 spans in sequence
- Revision rounds visible as repeated Synthesizer → Sign-off loops

---

## Prerequisites

- Phase 3 complete and working
- Harness server running on port 8000
