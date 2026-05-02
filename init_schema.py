#!/usr/bin/env python3
"""
init_schema.py — Pre-create the LLM Debater SQLite database schema.

The Next.js app (src/lib/db.ts) auto-creates this schema on first run.
Use this script when you want to initialise the database before starting
the server — e.g. in CI/CD pipelines, Docker builds, or production deploys.

Usage:
    python3 init_schema.py                    # creates data/debates.db
    python3 init_schema.py --db /tmp/test.db  # custom path
"""

import argparse
import os
import sqlite3


DDL = """
CREATE TABLE IF NOT EXISTS debates (
    id                TEXT    PRIMARY KEY,
    topic             TEXT    NOT NULL,
    saved_at          INTEGER NOT NULL,
    status            TEXT    NOT NULL,          -- 'paused' | 'stopped' | 'completed'
    total_rounds      INTEGER NOT NULL DEFAULT 0,
    completed_rounds  INTEGER NOT NULL DEFAULT 0,
    total_cost        REAL    NOT NULL DEFAULT 0,
    debaters          TEXT    NOT NULL DEFAULT '[]',   -- JSON array of DebaterConfig
    transcript        TEXT    NOT NULL DEFAULT '[]',   -- JSON array of DebateMessage
    consensus_summary TEXT                             -- nullable
);

CREATE TABLE IF NOT EXISTS prompts (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    role        TEXT    NOT NULL,                -- full system prompt text
    category    TEXT    NOT NULL DEFAULT 'General',
    created_at  INTEGER NOT NULL
);
"""


def init_schema(db_path: str) -> None:
    data_dir = os.path.dirname(db_path)
    if data_dir:
        os.makedirs(data_dir, exist_ok=True)

    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(DDL)
        conn.commit()

        # Verify tables exist
        tables = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
        table_names = [t[0] for t in tables]

        print(f"Database: {os.path.abspath(db_path)}")
        print(f"Tables:   {', '.join(table_names)}")
        print("Schema initialised successfully.")
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--db",
        default=os.path.join("data", "debates.db"),
        help="Path to the SQLite database file (default: data/debates.db)",
    )
    args = parser.parse_args()
    init_schema(args.db)


if __name__ == "__main__":
    main()
