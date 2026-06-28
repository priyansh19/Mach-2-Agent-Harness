# Mach2 — Multi-Agent ReAct Harness

> The next suit. Agents that think, use tools, and talk to each other.

Mach2 is a multi-agent brainstorming system where specialized AI agents operate inside their own ReAct loops — calling tools, reasoning step by step — and communicate with each other through a central harness. Built on top of everything learned from Mach1.

**Docs map:** [Architecture deep dive](docs/ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md) · [UI critique spec](.cursor/rules/mach2-ui-critique.mdc)

---

## Quick Start

Phase 1 is scaffold-only today — no harness code yet. Use this to stand up your local stack before typing the first ReAct agent.

```bash
# 1. Clone and enter the repo
git clone https://github.com/<you>/Mach-2-Agent-Harness.git
cd Mach-2-Agent-Harness

# 2. Python env + Phase 1 deps
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

# 3. Langfuse (self-hosted observability)
cd setup-scripts\langfuse
.\setup.ps1
# Writes ../../mach2-config.env — copy to repo root .env:
Copy-Item ..\..\mach2-config.env ..\.env

# 4. Ollama models
ollama pull gemma4:latest
ollama pull nomic-embed-text

# 5. Verify Ollama
ollama list
```

Once Phase 1 code exists, you'll add:

```bash
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000   # FastAPI harness
cd agent-ui && npm install && npm run dev                      # React UI (Phase 6)
```

Every agent run should appear in **Langfuse** at http://localhost:3000 when tracing is enabled.

---

## Prerequisites

| Requirement | Version / notes |
|-------------|-----------------|
| Python | 3.11+ recommended |
| Ollama | Running locally — [ollama.com](https://ollama.com) |
| Models | `gemma4:latest` (LLM), `nomic-embed-text` (embeddings) |
| Node.js | 18+ (Phase 6 UI only) |
| Docker Desktop | For self-hosted Langfuse — **run setup before Phase 1** |
| Claude CLI | Optional cloud fallback (already authenticated locally) |

---

## Langfuse Setup (self-hosted)

Langfuse is your **tracing plane** for Mach2 — all data stays on your machine. One script handles Docker, API keys, and config.

### Automated setup (recommended)

```powershell
cd setup-scripts\langfuse
.\setup.ps1
Copy-Item ..\..\mach2-config.env ..\.env
```

This will:

1. Clone Langfuse into `setup-scripts/langfuse/runtime/`
2. Generate secrets and headless-init org `mach2` + project `mach2-dev`
3. Start Docker Compose (`http://localhost:3000`)
4. Write **`mach2-config.env`** at repo root with all credentials

See [setup-scripts/langfuse/README.md](setup-scripts/langfuse/README.md) for stop/reset commands.

### Manual `.env` (if you already ran setup)

```env
LANGFUSE_HOST=http://localhost:3000
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PROJECT=mach2-dev
OBSERVABILITY=langfuse
```

### Verify tracing

After your first LangGraph call in Phase 1:

1. Open http://localhost:3000 → project **mach2-dev**
2. Confirm a new **Trace** appears with nested LLM/tool spans
3. Use Langfuse UI login from `mach2-config.env` (`LANGFUSE_UI_EMAIL` / `LANGFUSE_UI_PASSWORD`)

### What to trace per phase

| Phase | What shows up in Langfuse |
|-------|---------------------------|
| 1 | Single ReAct loop — thought/tool/observation chain |
| 2 | Harness routing between agents |
| 3 | Agent-as-tool calls (`spawn_scout`) |
| 4–5 | Research scouts, critic layers, Chroma retrievals |
| 6 | End-to-end user request → final answer |

---

## What's Different from Mach1

| | Mach1 | Mach2 |
|---|---|---|
| Agents | Single agent | Multiple specialized agents |
| Communication | User ↔ Agent | User ↔ Harness ↔ Agents ↔ Agents |
| Tool use | One shared tool pool | Each agent has its own tools |
| Reasoning | Single LangGraph graph | Per-agent ReAct loops inside a harness |
| Memory | Shared ChromaDB | Per-agent + shared memory layers |

---

## Architecture

> Full layer maps, Research Agent, and Critic pipeline detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

Live diagram: Excalidraw session `mach2-arch`.

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

### Layer map

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

## UI — Thinking & Critique Panel (Phase 6)

**Persisted requirement** — keep in context when building `agent-ui/`.

### User experience

| Element | Behavior |
|---------|----------|
| **Trigger button** | On response row or toolbar — e.g. "Thinking & Critiques" with badge count of open blockers/majors |
| **Panel** | Flyout, side drawer, or modal — **scrollable**, does not clutter main chat |
| **Thinking tab** | Stream ReAct steps: thought → tool call → observation; filter by agent (Harness, Scout, Critic, Synth) |
| **Critiques tab** | Cards per critique item — severity color, category chip, round number, suggested action |
| **Timeline** | Optional: horizontal rounds (Research → Critique R1 → Re-scout → Critique R2 → Final) |

### Principles

- **Clean default** — chat shows final/summary answer; reasoning is opt-in.
- **Live stream** — panel updates via SSE/WebSocket as harness emits events.
- **Search/filter** — by agent, severity, category, critique round.

### Target event types (backend → UI)

- `thinking` — agentId, step, content, timestamp
- `critique` — round, CritiqueItem[]
- `critique_resolved` — approved | revision_requested

Full UI component notes: `.cursor/rules/mach2-ui-critique.mdc`

---

## Build Phases

| # | Phase | What it adds | Status |
|---|-------|-------------|--------|
| 1 | Agent Base | Single ReAct agent with tool loop | ⬜ |
| 2 | Harness | Central orchestrator routing messages between agents | ⬜ |
| 3 | Agent-to-Agent | Agents can call other agents as tools | ⬜ |
| 4 | Specialization | Research Agent (scouting harness), Critic, Synthesizer | ⬜ |
| 5 | Memory | Per-agent memory + shared workspace | ⬜ |
| 6 | UI | Chat + **Thinking & Critique panel** (scrollable, streamed traces) | ⬜ |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Agent framework | LangChain + LangGraph + CrewAI |
| Observability | Langfuse (self-hosted) |
| Local LLM | Ollama — gemma4:latest |
| Cloud fallback | Claude via CLI |
| Embeddings | nomic-embed-text via Ollama |
| Vector DB | ChromaDB |
| API server | FastAPI + Uvicorn |
| UI | React + TypeScript + Vite |

---

## Project Structure

```
Mach-2-Agent-Harness/
├── .cursor/rules/          # Cursor rules (UI critique spec)
├── .github/                # PR template
├── agent-ui/               # React + TypeScript UI (Phase 6)
├── docs/
│   └── ARCHITECTURE.md     # Layer maps, Research + Critic deep dive
├── data/
│   └── chroma/             # ChromaDB persist dir (gitignored)
├── server/                 # FastAPI harness API (Phase 2+)
├── agents/                 # Per-agent ReAct modules (Phase 1+)
├── harness/                # Central orchestrator (Phase 2+)
├── tools/                  # Shared + per-agent tool belts
├── .env.example            # Environment template — copy to .env
├── requirements.txt        # Phase 1 Python deps
├── CONTRIBUTING.md         # How to contribute (manual Python typing)
├── CLAUDE.md               # AI assistant rules for this repo
└── README.md               # You are here
```

Directories marked Phase 1+ are **planned** — create them as you build each phase.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

| Variable | Purpose |
|----------|---------|
| `LANGFUSE_HOST` | Langfuse URL (e.g. `http://localhost:3000`) |
| `LANGFUSE_PUBLIC_KEY` | Langfuse project public key |
| `LANGFUSE_SECRET_KEY` | Langfuse project secret key |
| `LANGFUSE_PROJECT` | Project name (e.g. `mach2-dev`) |
| `OBSERVABILITY` | Set to `langfuse` |
| `OLLAMA_BASE_URL` | Ollama server URL |
| `OLLAMA_MODEL` | Primary LLM (`gemma4:latest`) |
| `OLLAMA_EMBEDDING_MODEL` | Embedding model (`nomic-embed-text`) |
| `CHROMA_*` | ChromaDB host, port, persist path, collection |
| `MACH2_*` | FastAPI host/port, CORS, debug, agent limits |

See `.env.example` for the full list with defaults.

---

## Development Workflow

Mach2 is built **phase by phase** — like rolling out a platform one microservice at a time. Each phase adds a capability; Langfuse proves it works before you move on.

1. **Pick a phase** from the Build Phases table below.
2. **Branch** — `git checkout -b phase-N-short-name`.
3. **Type Python manually** — 2–3 lines at a time with assistant guidance; run and confirm after each slice.
4. **Trace in Langfuse** — every new loop or route should produce a visible trace.
5. **UI separately** — `agent-ui/` files can be edited directly; Python stays manual per [CONTRIBUTING.md](CONTRIBUTING.md).
6. **PR** — use `.github/PULL_REQUEST_TEMPLATE.md`; include Smith run links when relevant.

### Local services checklist

| Service | Command | When needed |
|---------|---------|-------------|
| Ollama | `ollama serve` (usually auto-starts) | Phase 1+ |
| FastAPI | `uvicorn server.main:app --reload` | Phase 2+ |
| ChromaDB | Embedded via Python client | Phase 5 |
| UI dev server | `cd agent-ui && npm run dev` | Phase 6 |

---

## License

License TBD. Add `LICENSE` file before public release.

---

*Built by Priyansh · [priyansh.9071@gmail.com](mailto:priyansh.9071@gmail.com)*
