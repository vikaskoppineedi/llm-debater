'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { SavedDebate } from '@/lib/types';

interface HistoryStore {
  debates: SavedDebate[];
  isLoading: boolean;
  loadDebates: () => Promise<void>;
  saveDebate: (debate: Omit<SavedDebate, 'id' | 'savedAt'>) => Promise<string>;
  upsertDebate: (debate: SavedDebate) => Promise<void>;
  deleteDebate: (id: string) => Promise<void>;
  getDebate: (id: string) => SavedDebate | undefined;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  debates: [],
  isLoading: false,

  loadDebates: async () => {
    set({ isLoading: true });
    try {
      // One-time migration: move any old localStorage debates into SQLite
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('llm-debater-history');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const oldDebates: SavedDebate[] = parsed?.state?.debates ?? [];
            for (const d of oldDebates) {
              await fetch('/api/debates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(d),
              });
            }
          } catch { /* ignore parse errors */ }
          localStorage.removeItem('llm-debater-history');
        }
      }

      const res = await fetch('/api/debates');
      const data = await res.json();
      set({ debates: data.debates ?? [] });
    } catch {
      // silently fail — debates may be empty
    } finally {
      set({ isLoading: false });
    }
  },

  saveDebate: async (debate) => {
    const id = nanoid();
    const saved: SavedDebate = { ...debate, id, savedAt: Date.now() };
    // Optimistic update
    set((s) => ({ debates: [saved, ...s.debates] }));
    try {
      await fetch('/api/debates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      });
    } catch { /* ignore — state already updated locally */ }
    return id;
  },

  upsertDebate: async (debate) => {
    set((s) => {
      const exists = s.debates.some((d) => d.id === debate.id);
      if (exists) {
        return { debates: s.debates.map((d) => (d.id === debate.id ? debate : d)) };
      }
      return { debates: [debate, ...s.debates] };
    });
    try {
      await fetch('/api/debates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debate),
      });
    } catch { /* ignore */ }
  },

  deleteDebate: async (id) => {
    // Optimistic update
    set((s) => ({ debates: s.debates.filter((d) => d.id !== id) }));
    try {
      await fetch(`/api/debates/${id}`, { method: 'DELETE' });
    } catch { /* ignore */ }
  },

  getDebate: (id) => {
    return get().debates.find((d) => d.id === id);
  },
}));
