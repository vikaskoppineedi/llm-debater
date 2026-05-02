import db from './db';
import type { SavedDebate } from './types';

interface DebateRow {
  id: string;
  topic: string;
  saved_at: number;
  status: string;
  total_rounds: number;
  completed_rounds: number;
  total_cost: number;
  debaters: string;
  transcript: string;
  consensus_summary: string | null;
}

function rowToDebate(row: DebateRow): SavedDebate {
  return {
    id: row.id,
    topic: row.topic,
    savedAt: row.saved_at,
    status: row.status as SavedDebate['status'],
    totalRounds: row.total_rounds,
    completedRounds: row.completed_rounds,
    totalCost: row.total_cost,
    debaters: JSON.parse(row.debaters),
    transcript: JSON.parse(row.transcript),
    consensusSummary: row.consensus_summary ?? null,
  };
}

export function getAllDebates(): SavedDebate[] {
  const rows = db
    .prepare('SELECT * FROM debates ORDER BY saved_at DESC')
    .all() as DebateRow[];
  return rows.map(rowToDebate);
}

export function getDebateById(id: string): SavedDebate | undefined {
  const row = db
    .prepare('SELECT * FROM debates WHERE id = ?')
    .get(id) as DebateRow | undefined;
  return row ? rowToDebate(row) : undefined;
}

export function upsertDebate(debate: SavedDebate): void {
  db.prepare(`
    INSERT OR REPLACE INTO debates
      (id, topic, saved_at, status, total_rounds, completed_rounds, total_cost, debaters, transcript, consensus_summary)
    VALUES
      (@id, @topic, @savedAt, @status, @totalRounds, @completedRounds, @totalCost, @debaters, @transcript, @consensusSummary)
  `).run({
    id: debate.id,
    topic: debate.topic,
    savedAt: debate.savedAt,
    status: debate.status,
    totalRounds: debate.totalRounds,
    completedRounds: debate.completedRounds,
    totalCost: debate.totalCost,
    debaters: JSON.stringify(debate.debaters),
    transcript: JSON.stringify(debate.transcript),
    consensusSummary: debate.consensusSummary ?? null,
  });
}

export function deleteDebateById(id: string): void {
  db.prepare('DELETE FROM debates WHERE id = ?').run(id);
}
