# llm-debater — Claude Context

## What This Repo Is

A browser-based app that orchestrates real-time debates between multiple AI models (Claude, Gemini, Ollama) on technical topics. Models argue through structured phases and produce a final architecture document. The user acts as "Client" and can inject directives mid-debate.

## Why It Exists

Provides a structured way to get multiple AI perspectives on architecture and technical decisions, with automatic convergence phases and consensus summary generation.

## Key Components

| File/Dir | Role |
|---|---|
| `src/lib/debate-orchestrator.ts` | Core debate loop (480+ lines) — streaming, turns, auto-save |
| `src/lib/system-prompts.ts` | Phase-aware system prompt builders (5 phases) |
| `src/lib/providers/` | `claude.ts`, `gemini.ts`, `ollama.ts` — streaming async generators |
| `src/lib/db.ts` / `db-debates.ts` / `db-prompts.ts` | SQLite layer via `better-sqlite3` |
| `src/app/api/debate/stream/` | POST — stream a single LLM turn |
| `src/app/api/debate/summary/` | POST — generate consensus summary |
| `src/components/arena/` | DebateArena, TranscriptPane, DebateControls, ClientInterruptPanel |
| `src/store/` | Zustand stores — debate state, history, credentials, prompt library |
| `data/debates.db` | SQLite database (auto-created, gitignored) |

## CI/CD

No CI/CD pipeline. Run locally with `npm run dev`.

## Tech Stack

Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Zustand 5, SQLite (`better-sqlite3`), `@anthropic-ai/sdk`, `@google/generative-ai`, Ollama HTTP

## Debate Phases

| Phase | Range | Behaviour |
|---|---|---|
| 1 | 0–35% | Opening argumentation |
| 2 | 35–60% | Acknowledge opposing points |
| 3 | 60–80% | Convergence — synthesis |
| 4 | 80–100% | Lock in decisions |
| 5 | 100%+ | Final doc: Pro writes, Con confirms, Neutral synthesises |

## Recent Changes

- v1.1.0: Multi-model debates, real-time streaming, SQLite persistence, auto-save, client interrupt, cost tracking, HTML export, history browsing, prompt library
- Added CONTEXT.md (project overview)
- Initial commit + "done" commits during development

## Gotchas

- API keys are stored in browser localStorage only — never in the database or logs
- No test suite exists
- Context window per model: 2 opening args + 18 most recent messages
- Consecutive same-role messages are merged before sending (Claude/Gemini alternating role requirement)
- Run `./setup.sh` on first setup or manually `mkdir -p data && npm install`
