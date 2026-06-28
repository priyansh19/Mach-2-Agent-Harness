# Mach2 — Claude Instructions

## Hard Rules

- **Never edit agent/server/harness Python files directly.** Explain all changes in chat for the user to type manually. UI files (React/TypeScript/CSS) are the exception — manage those directly.
- **Never add Co-Authored-By in git commits.** No Claude/Anthropic attribution in commit messages ever.
- **2-3 lines at a time.** Never dump a full file. Give one small piece, explain it, wait for the user to run it and confirm it works, then add the next piece.

## User Context

- Senior DevOps background (4 years). Frame AI concepts as systems/orchestration analogies.
- Beginner in AI/ML — learning by typing code manually is intentional.
- Local setup: Ollama with gemma4:latest, Claude CLI authenticated.
- Coming from Mach1 (8-phase LangGraph agent). Mach2 is the next evolution.

## Project

Mach2 is a multi-agent ReAct harness — specialized agents that talk to each other and use tools inside their own ReAct loops, coordinated by a central orchestrator.

## UI Rule

The React/TypeScript UI lives in `agent-ui/`. The assistant manages it fully — write and edit those files directly without asking.

## UI Memory — Thinking & Critique Panel (Phase 6)

User wants **opt-in visibility** into LLM reasoning and critic output:

- **Button** opens a **scrollable panel** (flyout/drawer) — not inline in chat.
- **Tabs**: Thinking trace (ReAct steps) | Critiques (structured critic items).
- Main chat shows polished answers only; depth is on demand.
- See `.cursor/rules/mach2-ui-critique.mdc` and README § Critic + § UI for full spec.
- Backend should stream `thinking` and `critique` events; UI filters by agent, severity, round.
