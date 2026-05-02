# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-28

### Added
- **SQLite persistence** — debate history and prompt library stored in `data/debates.db` via `better-sqlite3`
- **Auto-save** — debates automatically saved to DB at end of every round, on stop, and on new debate (no manual save required)
- **Prompt library** — create, edit, and reuse custom expert personas; built-in curated prompts included
- **3+ debater support** — add any number of debaters; Neutral side acts as a technical moderator
- **Context windowing** — rolling 20-message window (keeps 2 opening args + 18 recent) prevents context overflow on long debates
- **Convergence pressure system** — debate phases (argumentation → convergence → final) with phase-aware system prompts that increase pressure to agree
- **Delete messages** — hover any message bubble to delete it from the transcript and future context
- **Round-end auto-pause** — debate pauses after every full round with an optional client comment panel
- **Home button** in the arena toolbar
- **`init_schema.py`** — Python script to pre-create the SQLite schema for CI/CD / production deploys
- **`setup.sh`** — updated to create `data/` directory and optionally run `init_schema.py`

### Fixed
- Messages no longer disappear after streaming (stale Zustand closure — `accumulatedText` tracking + `useDebateStore.getState()` for post-stream reads)
- Consecutive same-role API messages with 3+ debaters merged correctly (Claude/Gemini no longer reject with 422)
- Sentinel detection narrowed to `\n[USAGE:` / `\n[ERROR:` so normal LLM text containing `\n[` is not truncated
- Transcript pane `min-h-0` fix — scroll now works correctly
- Client directive framing softened — debaters now weave your input into the debate rather than pivoting entirely to address only you

### Changed
- `maxTokens` cap removed — debaters respond at full natural length (up to 8192 tokens) instead of being cut off at 1024
- Debate history migrated from localStorage to SQLite (one-time migration runs automatically on first load)

## [1.0.0] - 2026-02-27

### Added
- Initial release of LLM Debater
- Multi-model debate arena with Claude, Gemini, and Ollama support
- Pro / Con / Neutral side assignments per debater
- Real-time token streaming for all providers
- Convergence phases: argumentation → convergence → final
- Client interruption with targeted directives (per-model or all)
- Editable system prompt / expert persona per debater
- API key test button per debater card
- Model dropdowns with provider-specific model lists (Ollama fetched dynamically)
- Cost estimation with live running total and per-debater breakdown
- Debate history saved to localStorage (no API keys stored)
- Home screen with saved debate cards (view, delete)
- Semantic versioning and changelog
- README and setup.sh
