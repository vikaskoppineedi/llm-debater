import db from './db';
import type { PromptTemplate } from './types';

interface PromptRow {
  id: string;
  name: string;
  description: string;
  role: string;
  category: string;
  created_at: number;
}

function rowToPrompt(row: PromptRow): PromptTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    role: row.role,
    category: row.category,
    createdAt: row.created_at,
  };
}

export function getAllPrompts(): PromptTemplate[] {
  const rows = db
    .prepare('SELECT * FROM prompts ORDER BY created_at ASC')
    .all() as PromptRow[];
  return rows.map(rowToPrompt);
}

export function upsertPrompt(prompt: PromptTemplate): void {
  db.prepare(`
    INSERT OR REPLACE INTO prompts (id, name, description, role, category, created_at)
    VALUES (@id, @name, @description, @role, @category, @createdAt)
  `).run({
    id: prompt.id,
    name: prompt.name,
    description: prompt.description,
    role: prompt.role,
    category: prompt.category,
    createdAt: prompt.createdAt,
  });
}

export function deletePromptById(id: string): void {
  db.prepare('DELETE FROM prompts WHERE id = ?').run(id);
}
