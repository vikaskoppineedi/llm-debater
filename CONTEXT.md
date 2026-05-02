# LLM Debater — Project Context

## What This Is

A browser-based app that orchestrates real-time debates between multiple AI models (Claude, Gemini, Ollama) on technical topics. Models argue, converge through phases, and produce a final architecture document or recommendation. The user acts as "Client" and can inject directives mid-debate.

**Version:** 1.1.0 (released 2026-02-28) — mature, production-ready for local use

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 (localStorage persistence) |
| Database | SQLite via `better-sqlite3` |
| LLM providers | `@anthropic-ai/sdk`, `@google/generative-ai`, Ollama (local HTTP) |
| Build | Node.js 18+ |

---

## Project Structure

```
llm-debater/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── debate/stream/      # POST — stream a single LLM turn
│   │   │   ├── debate/summary/     # POST — generate consensus summary
│   │   │   ├── debates/            # GET/POST/DELETE history
│   │   │   ├── prompts/            # Prompt library CRUD
│   │   │   ├── ollama-models/      # GET available local Ollama models
│   │   │   └── test-provider/      # POST — validate API key
│   │   └── page.tsx                # Screen router (Home/Setup/Arena/History)
│   ├── components/
│   │   ├── arena/                  # DebateArena, TranscriptPane, MessageBubble,
│   │   │                           # DebateControls, ClientInterruptPanel, ConsensusSummaryCard
│   │   ├── setup/                  # SetupScreen, DebaterCard
│   │   ├── home/                   # HomeScreen, SavedDebateCard
│   │   ├── history/                # HistoryScreen
│   │   ├── prompt-library/         # PromptLibraryScreen, PromptEditorModal
│   │   └── settings/               # SettingsScreen (API keys)
│   ├── lib/
│   │   ├── debate-orchestrator.ts  # Core debate loop (480+ lines) — streaming, turns, auto-save
│   │   ├── system-prompts.ts       # Phase-aware system prompt builders (5 phases)
│   │   ├── cost-calculator.ts      # Token pricing per model
│   │   ├── db.ts / db-debates.ts / db-prompts.ts  # SQLite layer
│   │   ├── export-html.ts          # Transcript export
│   │   └── providers/
│   │       ├── claude.ts           # streamClaude() async generator
│   │       ├── gemini.ts           # streamGemini() async generator
│   │       └── ollama.ts           # streamOllama() async generator
│   └── store/
│       ├── debate-store.ts         # Active debate state + actions (Zustand)
│       ├── history-store.ts        # Saved debates
│       ├── credentials-store.ts    # API keys (localStorage only, never in DB)
│       └── prompt-library-store.ts
└── data/debates.db                 # SQLite (auto-created, gitignored)
```

---

## How the Debate Works

**Phases** (based on % of total rounds completed):

| Phase | Range | Behavior |
|---|---|---|
| 1 | 0–35% | Opening argumentation |
| 2 | 35–60% | Acknowledge valid opposing points |
| 3 | 60–80% | Convergence — find synthesis |
| 4 | 80–100% | Lock in decisions |
| 5 | 100%+ | Final: Pro writes architecture doc, Con confirms, Neutral synthesizes |

**Context window:** 2 opening args + 18 most recent messages (prevents token bloat)

**Consecutive role merging:** Messages from the same provider are merged before sending to satisfy Claude/Gemini's alternating role requirement.

---

## Supported Models

| Provider | Models |
|---|---|
| Claude | claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5-20251001 |
| Gemini | gemini-2.0-flash, gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash |
| Ollama | Any locally installed model (fetched dynamically) |

---

## How to Run

```bash
npm install
mkdir -p data
npm run dev
# Open http://localhost:3000
```

Or use the quick-start:
```bash
chmod +x setup.sh && ./setup.sh && npm run dev
```

**No `.env` file needed.** API keys are entered in the Settings screen and stored in browser localStorage only — never written to the database or logs.

---

## Configuration (via Settings screen)

- `ANTHROPIC_API_KEY` — for Claude models
- `GOOGLE_AI_API_KEY` — for Gemini models
- `OLLAMA_HOST` — optional override (default: `http://localhost:11434`)

---

## Current State

**Done (v1.1.0):**
- Multi-model debates with 2+ debaters
- Real-time token streaming from all providers
- SQLite persistence (debates + prompt library)
- Auto-save every round, on stop, on new debate
- Client interrupt with mid-debate directives
- Cost tracking per turn + total
- HTML export, history browsing, resume debates
- ⚡ "Reach Conclusion" button, extend rounds mid-debate, delete messages
- Built-in curated prompt library + custom prompts

**Not done / future:**
- Tests (no test suite exists)
- Cloud deployment (local/self-hosted only)
- PDF/Markdown export (HTML only)
- Multi-user / authentication
