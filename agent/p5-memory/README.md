# Phase 5 — Memory

> Status: 🔲 Not started

**What this phase adds:** Persistent memory across runs. Each agent gets short-term working memory (current session context). All agents share a ChromaDB workspace — scouts write findings to it, the synthesizer retrieves relevant prior research before starting a new run. Avoids re-scouting things already known.

---

## What gets built

- `memory/chroma_store.py` — ChromaDB client wrapper (embed → upsert → query)
- `memory/agent_memory.py` — per-agent short-term context window manager
- `memory/shared_workspace.py` — read/write interface for the shared collection
- Scout agents write structured findings to shared memory after each run
- Research orchestrator queries shared memory before spawning new scouts

---

## Memory architecture

```
Per-agent short-term     Shared ChromaDB workspace
─────────────────────    ──────────────────────────
Session messages[]    ←→  scout findings (embedded)
Tool call history         prior research reports
Working scratchpad        user-approved answers
```

ChromaDB persists to `data/chroma/` (gitignored).

---

<!-- ✅ Fill this section in when the phase is marked complete and pushed to GitHub -->

## How to replicate

> _Steps will be added here when Phase 5 is marked complete._

---

## What to verify

- Run the same research query twice — second run should retrieve from memory and skip redundant scouts
- ChromaDB collection grows in `data/chroma/` between runs
- Langfuse traces show `memory.retrieve` spans before scout spawning

---

## Prerequisites

- Phase 4 complete and working
- `nomic-embed-text` pulled via Ollama (`ollama pull nomic-embed-text`)
- ChromaDB installed (`pip install -r requirements.txt`)
