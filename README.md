# LLM Debater

A browser-based app where two or more AI models debate each other on technical topics — working toward a shared consensus that satisfies you, the Client.

---

## Features

### Debate Engine
- **Multi-model debates** — Claude, Gemini, and Ollama models debate in real-time
- **2+ debaters** — configure as many participants as you want; each gets its own side, model, and system prompt
- **Pro / Con / Neutral sides** — Neutral acts as a technical moderator steering toward consensus
- **Convergence phases** — debates move through argumentation → convergence → final, with increasing pressure to agree
- **Full-length responses** — no artificial token cap; models respond as fully as they need to
- **Context windowing** — keeps the 2 opening arguments + the 18 most recent messages to prevent context overflow on long debates
- **Multi-debater context** — each debater sees all other debaters' messages merged into the correct API role format; no duplicate or conflicting roles

### Client Controls
- **Round-end pause** — debate automatically pauses after each full round so you can read and optionally comment before continuing
- **Client interruption** — interrupt mid-turn, type a directive, and target it at specific models or all of them
- **Targeted directives** — your input is woven into the ongoing debate; debaters acknowledge it while continuing to engage each other
- **⚡ Reach Conclusion** — skips straight to the final round; only the Pro debater delivers a final architecture recommendation
- **Extend Rounds** — add +5 or +10 rounds mid-debate without stopping
- **Delete messages** — hover any message to reveal a delete button; removes it from context for all future turns

### Persistence
- **SQLite database** — debate history and prompt library are stored in `data/debates.db` (auto-created on first run)
- **Auto-save** — debates are saved to the DB at the end of every round, on stop, and when starting a new debate — no manual save required
- **Manual save** — "↓ Save to History" button in the arena toolbar for an on-demand upsert
- **Resume from history** — load any past debate and continue from where it left off
- **Home screen** — browse, view, and delete past debates

### Prompts
- **Prompt library** — save and reuse custom expert personas across debates
- **Built-in prompts** — curated starting points for common roles (senior engineer, product manager, security architect, etc.)
- **Editable per-debater** — expand the system prompt field on any debater card to customise before the debate starts
- **📚 Library button** — apply a saved prompt to any debater in one click

### Cost & Transparency
- **Live cost tracking** — per-turn and per-debater token cost estimates shown in the header
- **Consensus summary** — when the debate concludes, a summary card shows what was agreed, plus a full cost breakdown
- **API keys in localStorage only** — keys are never written to the database or logs

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 18+** | [nodejs.org](https://nodejs.org) |
| **Anthropic API key** | [console.anthropic.com](https://console.anthropic.com) — for Claude models |
| **Google AI API key** | [aistudio.google.com](https://aistudio.google.com) — for Gemini models |
| **Ollama** _(optional)_ | [ollama.ai](https://ollama.ai) — for local open-source models |
| **Python 3** _(optional)_ | Only needed if you want to pre-create the DB schema via `init_schema.py` |

---

## Setup

### Option 1: Quick Start Script

```bash
chmod +x setup.sh
./setup.sh
npm run dev
```

### Option 2: Manual

```bash
# 1. Install dependencies
npm install

# 2. Create the data directory (DB is auto-created on first run)
mkdir -p data

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 3: Pre-create the Database (Python)

If you want to initialise the SQLite schema before starting the app (useful for
production deployments, CI/CD pipelines, or just to inspect the schema):

```bash
python3 init_schema.py
# Creates data/debates.db with the debates and prompts tables

# Optionally specify a custom path:
python3 init_schema.py --db /path/to/custom.db
```

The app auto-creates the same schema on first run via `src/lib/db.ts`, so this
step is never strictly required.

---

## Database Schema

The SQLite database lives at `data/debates.db` and contains two tables:

### `debates`

| Column | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | nanoid — unique debate identifier |
| `topic` | TEXT | The debate topic/question |
| `saved_at` | INTEGER | Unix timestamp (ms) |
| `status` | TEXT | `paused` \| `stopped` \| `completed` |
| `total_rounds` | INTEGER | Configured number of rounds |
| `completed_rounds` | INTEGER | Rounds finished at time of save |
| `total_cost` | REAL | Estimated USD cost |
| `debaters` | TEXT | JSON array of `DebaterConfig` objects |
| `transcript` | TEXT | JSON array of `DebateMessage` objects |
| `consensus_summary` | TEXT | AI-generated summary (nullable) |

### `prompts`

| Column | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | nanoid — unique prompt identifier |
| `name` | TEXT | Display name |
| `description` | TEXT | Short description shown in the library |
| `role` | TEXT | Full system prompt text |
| `category` | TEXT | Grouping label (e.g. `Engineering`, `Product`) |
| `created_at` | INTEGER | Unix timestamp (ms) |

---

## Ollama Setup (optional)

```bash
# Install Ollama from https://ollama.ai, then pull a model:
ollama pull llama3
ollama pull mistral
ollama pull deepseek-r1

# Start the Ollama server (usually auto-starts on macOS/Linux)
ollama serve
```

The app auto-detects installed models at `http://localhost:11434`. You can
override the host in Settings if Ollama is running on a different machine.

---

## Usage

### 1. Home Screen
Browse saved debates or click **New Debate** to start a fresh one.

### 2. Setup Screen

Configure your debate:

- **Topic** — enter any technical question or proposition (the text box is resizable)
- **Rounds** — drag the slider (1–20); you can extend mid-debate with +5 / +10
- **Debaters** — configure each AI participant:
  - **Name** — give each model a custom name
  - **Provider** — Claude, Gemini, or Ollama
  - **Model** — choose from a dropdown (Ollama models fetched from your local install)
  - **Side** — assign **Pro**, **Con**, or **Neutral** (Neutral = technical moderator)
  - **System Prompt** — expand to edit the expert persona, or apply one from the 📚 Library
- Click **+ Add Debater** to add a 3rd, 4th, etc. debater
- Click **Start Debate** when ready

### 3. Debate Arena

Watch the models argue in real-time:

| Bubble style | Role |
|---|---|
| Left-aligned blue | Pro |
| Right-aligned red | Con |
| Centred purple | Neutral |
| Centred amber | You (Client) |

**Controls:**

| Button | What it does |
|---|---|
| ⏸ Pause | Waits for the current response to finish, then pauses |
| ▶ Resume | Continues the debate |
| ✋ Interrupt | Immediately pauses and opens the Client input panel |
| ⚡ Reach Conclusion | Jumps to the final round — Pro delivers a concrete recommendation |
| Extend +5 / +10 | Adds more rounds without stopping |
| ■ Stop | Ends and saves the debate |
| + New Debate | Saves the current debate and starts fresh |
| ⌂ Home | Returns to the home screen (debate is auto-saved) |
| ↓ Save to History | Manual upsert to the DB |

**Round-end pause:**
After every complete round the debate pauses automatically. You can:
- Add a comment or redirect (sent to All Models or a specific debater)
- Click **▶ Continue** to resume without comment

**Client interruption:**
Press **Interrupt**, type your directive, choose a target, then **Send**. Your
input is woven into each debater's context alongside the ongoing debate.

### 4. Consensus Summary

When the debate concludes, a summary card shows the agreed recommendation, plus a cost breakdown per debater and a total.

---

## Supported Providers & Models

| Provider | Models |
|---|---|
| Claude (Anthropic) | claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5-20251001 |
| Gemini (Google) | gemini-2.0-flash, gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash |
| Ollama (local) | Any model installed locally — fetched dynamically |

---

## API Keys & Privacy

- API keys are entered in the UI and stored in **browser localStorage** only
- Keys are passed through the local Next.js API routes to provider SDKs — they never leave your machine
- Keys are **never** written to `data/debates.db` or any log

---

## Cost Estimation

Costs are estimated based on published per-token rates:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| claude-opus-4-6 | $15.00 | $75.00 |
| claude-sonnet-4-6 | $3.00 | $15.00 |
| claude-haiku-4-5-20251001 | $0.80 | $4.00 |
| gemini-2.0-flash | $0.075 | $0.30 |
| gemini-1.5-pro | $1.25 | $5.00 |
| Ollama (any) | $0.00 | $0.00 |

---

## Project Structure

```
llm-debater/
├── data/                        # SQLite database (auto-created, gitignored)
│   └── debates.db
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── debate/
│   │   │   │   ├── stream/      # Streaming turn endpoint
│   │   │   │   └── summary/     # Consensus summary endpoint
│   │   │   ├── debates/         # History CRUD (GET, POST, DELETE)
│   │   │   ├── ollama-models/   # Fetch local Ollama model list
│   │   │   └── test-provider/   # API key validation
│   │   └── page.tsx
│   ├── components/
│   │   ├── arena/               # Debate arena UI
│   │   ├── home/                # Home screen
│   │   ├── prompt-library/      # Prompt library UI
│   │   ├── settings/            # Settings screen
│   │   └── setup/               # Debate setup screen
│   ├── lib/
│   │   ├── db.ts                # SQLite connection + schema bootstrap
│   │   ├── db-debates.ts        # Debate CRUD helpers
│   │   ├── db-prompts.ts        # Prompt CRUD helpers
│   │   ├── debate-orchestrator.ts  # Core debate loop (streaming, turns, auto-save)
│   │   ├── providers/           # claude.ts, gemini.ts, ollama.ts
│   │   ├── system-prompts.ts    # System prompt builders
│   │   ├── cost-calculator.ts   # Token cost math
│   │   └── types.ts             # Shared TypeScript types
│   └── store/
│       ├── debate-store.ts      # Active debate state (Zustand + localStorage)
│       ├── history-store.ts     # Saved debates (Zustand → SQLite API)
│       └── credentials-store.ts # API keys (Zustand + localStorage)
├── init_schema.py               # Optional: pre-create the SQLite schema
├── setup.sh                     # Quick-start shell script
└── package.json
```

---

## Version

Current version: **1.1.0** — see [CHANGELOG.md](./CHANGELOG.md)
