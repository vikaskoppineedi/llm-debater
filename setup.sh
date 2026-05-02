#!/bin/bash
set -e

echo "========================================="
echo "  LLM Debater — Setup"
echo "========================================="
echo ""

# ── Node.js check ─────────────────────────────────────────────────────────────
if ! node -v >/dev/null 2>&1; then
  echo "Error: Node.js 18+ is required."
  echo "Install from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js 18+ required (found $(node -v))"
  exit 1
fi

echo "✓ Node.js $(node -v)"

# ── Install npm dependencies ───────────────────────────────────────────────────
echo ""
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# ── Create data directory ──────────────────────────────────────────────────────
# The SQLite database (data/debates.db) is auto-created by the app on first run.
# We create the directory here so it exists before npm run dev.
if [ ! -d "data" ]; then
  mkdir -p data
  echo "✓ Created data/ directory (SQLite database will be stored here)"
else
  echo "✓ data/ directory already exists"
fi

# ── Optional: pre-create SQLite schema via Python ─────────────────────────────
if command -v python3 >/dev/null 2>&1; then
  echo ""
  echo "Python 3 found. Pre-creating SQLite schema..."
  python3 init_schema.py
  echo "✓ Database schema initialised at data/debates.db"
else
  echo ""
  echo "Python 3 not found (optional). The database schema will be"
  echo "auto-created by the app on first run."
fi

# ── Ollama check (optional) ────────────────────────────────────────────────────
echo ""
if command -v ollama >/dev/null 2>&1; then
  echo "✓ Ollama found — local models will be available."
  echo "  Pull models with: ollama pull llama3 / mistral / deepseek-r1"
else
  echo "  Ollama not found (optional). Install from https://ollama.ai"
  echo "  to use local open-source models."
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  Setup complete!"
echo "========================================="
echo ""
echo "Start the dev server:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Settings (API keys, Ollama host) are configured in the app UI."
echo "Debate history is stored in: data/debates.db"
echo ""
