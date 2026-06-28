# Mach2 — Multi-Agent ReAct Harness

> The next suit. Agents that think, use tools, and talk to each other.

Mach2 is a multi-agent brainstorming system where specialized AI agents operate inside their own ReAct loops — calling tools, reasoning step by step — and communicate with each other through a central harness. Built on top of everything learned from Mach1.

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

*(diagram coming as phases complete)*

---

## Build Phases

| # | Phase | What it adds | Status |
|---|-------|-------------|--------|
| 1 | Agent Base | Single ReAct agent with tool loop | ⬜ |
| 2 | Harness | Central orchestrator routing messages between agents | ⬜ |
| 3 | Agent-to-Agent | Agents can call other agents as tools | ⬜ |
| 4 | Specialization | Researcher, Critic, Synthesizer agent roles | ⬜ |
| 5 | Memory | Per-agent memory + shared workspace | ⬜ |
| 6 | UI | Chat interface showing agent conversations live | ⬜ |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Agent framework | LangChain + LangGraph |
| Local LLM | Ollama — gemma4:latest |
| Cloud fallback | Claude via CLI |
| Embeddings | nomic-embed-text via Ollama |
| Vector DB | ChromaDB |
| API server | FastAPI + Uvicorn |
| UI | React + TypeScript + Vite |

---

## Running Locally

*(instructions added as phases complete)*

---

*Built by Priyansh · [priyansh.9071@gmail.com](mailto:priyansh.9071@gmail.com)*
