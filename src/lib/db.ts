import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'debates.db');

// Singleton — reuse the connection across Next.js hot reloads in dev
const g = global as typeof global & { _debateDb?: Database.Database };
const db: Database.Database = g._debateDb ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== 'production') g._debateDb = db;

db.exec(`
  CREATE TABLE IF NOT EXISTS debates (
    id                TEXT    PRIMARY KEY,
    topic             TEXT    NOT NULL,
    saved_at          INTEGER NOT NULL,
    status            TEXT    NOT NULL,
    total_rounds      INTEGER NOT NULL DEFAULT 0,
    completed_rounds  INTEGER NOT NULL DEFAULT 0,
    total_cost        REAL    NOT NULL DEFAULT 0,
    debaters          TEXT    NOT NULL DEFAULT '[]',
    transcript        TEXT    NOT NULL DEFAULT '[]',
    consensus_summary TEXT
  );

  CREATE TABLE IF NOT EXISTS prompts (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    role        TEXT    NOT NULL,
    category    TEXT    NOT NULL DEFAULT 'General',
    created_at  INTEGER NOT NULL
  );
`);

export default db;
