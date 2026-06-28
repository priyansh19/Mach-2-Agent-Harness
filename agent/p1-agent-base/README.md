# Phase 1 — Agent Base

> Status: ✅ Complete

Single-agent ReAct loop powered by ornith:9b via Ollama. Every step is traced to Langfuse with token counts per step.

---

## What was built

- `tools.py` — tool registry with the `finish` tool (the only exit point for the loop)
- `agent.py` — ReAct loop: calls Ollama, parses JSON response, routes to tool or loops back
- `docs/ornith-system-prompt.md` — full harness system prompt loaded at runtime (not hardcoded)

---

## How it works

```
user input
    └─► build message history (system prompt + user message)
            └─► call ornith:9b via Ollama /api/chat
                    └─► parse JSON response { thought, action, action_input }
                            ├─► action == "finish" → return answer
                            └─► other action → append to history, loop
```

Each iteration is a Langfuse span under a `react-agent` trace. Token counts (input + output) are recorded per step.

---

## Prerequisites

- Ollama running locally with `ornith:9b` pulled (`ollama pull ornith`)
- Langfuse running via Docker (`docker compose up -d` from project root)
- Python dependencies installed (`pip install -r requirements.txt`)

---

## Run

```bash
python agent/p1-agent-base/agent.py
```

Expected terminal output:

```
[thought] Simple arithmetic question, no tools needed.

[answer] 2 + 2 = 4
```

---

## Verify in Langfuse

Open `http://localhost:3000` → Tracing → Traces → click `react-agent`

```
react-agent (trace)
    └─► step-1 (span)
            input:  { thought, action }
            output: final answer
            usage:  { input_tokens, output_tokens, total }
```
