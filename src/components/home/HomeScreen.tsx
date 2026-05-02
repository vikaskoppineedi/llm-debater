'use client';

import { useEffect } from 'react';
import { useHistoryStore } from '@/store/history-store';
import { SavedDebateCard } from './SavedDebateCard';
import type { SavedDebate } from '@/lib/types';

interface HomeScreenProps {
  onNewDebate: () => void;
  onViewDebate: (debate: SavedDebate) => void;
  onContinueDebate: (debate: SavedDebate) => void;
  onViewHistory: () => void;
  onPromptLibrary: () => void;
  onSettings: () => void;
}

export function HomeScreen({
  onNewDebate,
  onViewDebate,
  onContinueDebate,
  onViewHistory,
  onPromptLibrary,
  onSettings,
}: HomeScreenProps) {
  const debates = useHistoryStore((s) => s.debates);
  const isLoading = useHistoryStore((s) => s.isLoading);
  const loadDebates = useHistoryStore((s) => s.loadDebates);
  const deleteDebate = useHistoryStore((s) => s.deleteDebate);
  const version = '1.0.0';

  useEffect(() => {
    loadDebates();
  }, [loadDebates]);

  const recentDebates = debates.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LLM Debater</h1>
          <p className="text-xs text-gray-500 mt-0.5">v{version}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onPromptLibrary}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            📚 Prompts
          </button>
          <button
            onClick={onSettings}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ⚙ Settings
          </button>
          <button
            onClick={onNewDebate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            + New Debate
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {isLoading ? (
          <div className="text-center py-24 text-gray-500 text-sm">Loading…</div>
        ) : debates.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4">⚖️</div>
            <p className="text-lg font-medium text-gray-400">No debates yet</p>
            <p className="text-sm mt-2">Click &ldquo;New Debate&rdquo; to get started</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                Recent Debates
              </h2>
              {debates.length > 3 && (
                <button
                  onClick={onViewHistory}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View all {debates.length} →
                </button>
              )}
            </div>
            <div className="space-y-3">
              {recentDebates.map((debate) => (
                <SavedDebateCard
                  key={debate.id}
                  debate={debate}
                  onView={() => onViewDebate(debate)}
                  onContinue={() => onContinueDebate(debate)}
                  onDelete={() => deleteDebate(debate.id)}
                />
              ))}
            </div>
            {debates.length > 3 && (
              <button
                onClick={onViewHistory}
                className="mt-4 w-full py-3 border border-gray-800 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:border-gray-700 transition-colors"
              >
                View all {debates.length} debates →
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
