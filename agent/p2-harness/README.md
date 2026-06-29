# Phase 2 — Session Harness

> Status: ✅ Complete

**What this phase adds:** A FastAPI server wrapping the ReAct agent loop with session management. The Electron UI gains a Direct / Harness mode toggle — Direct streams tokens from Ollama, Harness runs the full ReAct loop and returns a finished answer.

---

## Architecture

```
Electron UI  ──(IPC)──  index.ts  ──(HTTP)──  FastAPI :8000  ──  agent.py  ──  Ollama :11434
                Direct mode                     Harness mode       ReAct loop     ornith:9b
```

---

## What got built

- `agent/p2-harness/agent.py` — `run_agent(messages)` accepts an external message list; system prompt is owned by the session, not loaded every call
- `agent/p2-harness/run.py` — interactive CLI REPL for testing the agent without the server
- `server/main.py` — FastAPI with `/health` and `/chat`; session dict keeps system prompt loaded once per session_id
- UI mode toggle (Direct / Harness) in ChatView and WelcomeView
- Langfuse traces tagged `["harness", "ornith"]` on harness calls; `["direct", "ollama"]` on UI direct calls

---

## Running the server

```bash
cd <project-root>
python -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

## API

`POST /chat`

```json
{ "message": "What is the capital of France?", "session_id": "" }
```

Returns `{ "answer": "Paris", "session_id": "<uuid>" }`. Pass the returned `session_id` on follow-up messages to maintain session context.

---

## What to verify in Langfuse

- Traces at `http://localhost:3000` tagged `harness` vs `direct`
- Each harness trace has one span per ReAct step with token counts
- Custom dashboard widgets compare latency and token usage between the two paths
