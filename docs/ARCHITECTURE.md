# Mach2 Architecture

> Canonical reference for layer maps, Research Agent scouting harness, and Critic pipeline.  
> The README contains the same material for onboarding; this doc is for deep dives without scrolling past Quick Start.

Live diagram: Excalidraw session `mach2-arch` · [JSON](mach2-arch.excalidraw.json)

**View locally:** open http://localhost:3100?sessionId=mach2-arch (Excalidraw MCP server must be running). If the canvas looks empty, click **Scroll back to content** or **Reset zoom** (bottom-left).

---

## System overview

```
User ↔ Main Harness ↔ UI (Thinking & Critique Panel ← SSE events)
              │
    ┌─────────┼─────────┬──────────────┐
    ▼         ▼         ▼              │
 Research   Critic    Synthesizer      │
 Agent      Pipeline   (L6)            │
 (L0–L1)    (L2–L7)                    │
    │         │         ▲              │
    │    re-scout      │ revision     │
    └────► L3 ─────────┘              │
              │ approved               │
              └──────────► User        │
                    Shared Memory (ChromaDB)
```

---

## Layer map

| Layer | Component | Role |
|-------|-----------|------|
| L0 | Research Orchestrator + Scout Pool | Dynamic fan-out research |
| L1 | Research Synthesizer | Merge scout reports |
| L2 | Fact Critic | Sources, recency, conflicts |
| L3 | Gap Critic | Missing dimensions → re-scout |
| L4 | Logic Critic | Scope and consistency |
| L5 | Efficiency Critic | Cut redundancy |
| L6 | Synthesizer Agent | User-facing answer from critique ledger |
| L7 | Sign-off Critic | Approve or request revision |
| UI | Thinking & Critique Panel | Opt-in scrollable trace of thinking + critiques |

---

## Research Agent — Scouting Harness

The Research Agent is not a single search call. It is a **nested harness**: an internal orchestrator decomposes the mission, spawns dynamically scoped scouting agents, then merges their reports before returning to the main harness.

### Roles inside Research Agent

| Component | Job |
|-----------|-----|
| **Research Orchestrator** | Reads the goal from the main harness, plans which scouts to spawn, sets each scout's mission brief and tool subset, decides if more scouts are needed |
| **Scouting Agents** | Independent ReAct loops — one mission each (web, Stack Overflow, Pinterest, icon packs, design patterns, tool patterns, DevOps tools, or any dynamic scenario) |
| **Research Synthesizer** | Dedupes, ranks, and structures scout findings into one research report for the main Synthesizer |

### Scout dispatch model

- **Dynamic fan-out** — orchestrator chooses count and scope per request (not a fixed pipeline)
- **Per-scout brief** — `{ mission, sources[], query, budget, timeout }` passed at spawn
- **Guardrails** — max concurrent scouts, token budget, deduped missions, structured JSON output schema
- **Agent-as-tool** — orchestrator calls `spawn_scout(...)`; scouts call source-specific tools only

### Scout tool belts (examples)

| Scout focus | Tools |
|-------------|-------|
| Web / docs | `search_web`, `fetch_and_summarize` |
| Stack Overflow | `stackoverflow_search` |
| Design patterns | `search_web` + `browser_snapshot` (Mobbin, Dribbble, etc.) |
| Icon packs | `search_icons`, targeted CDN/docs fetch |
| DevOps tools | `search_web` with docs-site bias |
| Pinterest / visual | `browser_snapshot`, web search (no stable public API) |

### Flow

1. Main **Harness** routes a research task to the Research Agent
2. **Research Orchestrator** decomposes → spawns N scouts in parallel (within limits)
3. Each **Scout** runs ReAct until mission complete or timeout
4. **Research Synthesizer** merges scout reports
5. Output flows to **Critic** / **Synthesizer** and **Shared Memory**

Maps to build phases: Phase 3 (`spawn_scout` as agent-as-tool), Phase 4 (Research Agent specialization), Phase 5 (cache prior scout results in ChromaDB).

---

## Critic Agent — Multi-Layer Critique System

The Critic is not one monolithic review pass. It is a **pipeline of specialized critique layers** designed to maximize final-answer efficiency: catch problems early, avoid redundant research, and give the Synthesizer a precise **critique ledger** to write from.

### Design goal

**Maximum quality per token** — each layer has a narrow job. Fail fast on blockers; only spawn rework when a lower layer flags a gap worth the cost.

### Critique layers

| Layer | Name | Checks | Output |
|-------|------|--------|--------|
| L2 | **Fact Critic** | Sources exist, recency, cross-scout contradictions | `unsourced`, `stale`, `conflict` items |
| L3 | **Gap Critic** | Missing dimensions vs user goal | `spawn_scout` recommendations |
| L4 | **Logic Critic** | Scope fit, internal consistency, recommendation ↔ evidence | `logic`, `scope` items |
| L5 | **Efficiency Critic** | Redundant findings, verbosity, budget | merge/cut directives |
| L7 | **Sign-off Critic** | Ready for synthesis? | `approved` or `revision_requested` (max N rounds) |

Layers L0–L1 are Research (scouts + research synthesizer). Layer L6 is the main **Synthesizer** (writes the user-facing answer from the approved ledger).

### Critique loop

```
Research report → L2 Fact → L3 Gap → (optional re-scout) → L4 Logic → L5 Efficiency → Synthesizer draft → L7 Sign-off
                                                                                              ↓ revision
                                                                                         back to Synthesizer
```

### Structured critique item (API/UI contract)

```json
{
  "id": "c-042",
  "severity": "major",
  "category": "gap",
  "message": "No dark-mode UI references in design scout report",
  "claimRef": "scout-design-3",
  "suggestedAction": "spawn_scout({ mission: 'dark mode dashboard patterns', sources: ['mobbin'] })"
}
```

Severities: `blocker` | `major` | `minor` | `info`

---

## UI event contract (Phase 6)

Backend streams these event types to `agent-ui/`:

| Event | Payload |
|-------|---------|
| `thinking` | agentId, step, content, timestamp |
| `critique` | round, CritiqueItem[] |
| `critique_resolved` | approved \| revision_requested |

Full UI component notes: `.cursor/rules/mach2-ui-critique.mdc`

---

## Tech stack reference

| Layer | Tech |
|-------|------|
| Agent framework | LangChain + LangGraph + CrewAI |
| Observability | Langfuse (self-hosted) |
| Local LLM | Ollama — gemma4:latest |
| Embeddings | nomic-embed-text via Ollama |
| Vector DB | ChromaDB |
| API server | FastAPI + Uvicorn |
| UI | React + TypeScript + Vite |
