'use client';

import { useEffect } from 'react';
import { useHistoryStore } from '@/store/history-store';
import { SavedDebateCard } from '@/components/home/SavedDebateCard';
import type { SavedDebate } from '@/lib/types';

interface HistoryScreenProps {
  onBack: () => void;
  onViewDebate: (debate: SavedDebate) => void;
  onContinueDebate: (debate: SavedDebate) => void;
}

export function HistoryScreen({ onBack, onViewDebate, onContinueDebate }: HistoryScreenProps) {
  const debates = useHistoryStore((s) => s.debates);
  const isLoading = useHistoryStore((s) => s.isLoading);
  const loadDebates = useHistoryStore((s) => s.loadDebates);
  const deleteDebate = useHistoryStore((s) => s.deleteDebate);

  useEffect(() => {
    loadDebates();
  }, [loadDebates]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Debate History</h1>
          <p className="text-xs text-gray-500 mt-0.5">{debates.length} debate{debates.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {isLoading ? (
          <div className="text-center py-24 text-gray-500 text-sm">Loading…</div>
        ) : debates.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium text-gray-400">No saved debates</p>
            <p className="text-sm mt-2">Debates are saved automatically when completed or stopped.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {debates.map((debate) => (
              <SavedDebateCard
                key={debate.id}
                debate={debate}
                onView={() => onViewDebate(debate)}
                onContinue={() => onContinueDebate(debate)}
                onDelete={() => deleteDebate(debate.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
