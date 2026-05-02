'use client';

import { useEffect, useState } from 'react';
import { usePromptLibraryStore } from '@/store/prompt-library-store';
import { PromptEditorModal } from './PromptEditorModal';
import type { PromptTemplate } from '@/lib/types';

const CATEGORIES = ['All', 'Technology', 'AI', 'Health', 'Fitness', 'Business', 'General'];

const CATEGORY_COLORS: Record<string, string> = {
  Technology: 'bg-blue-900/50 text-blue-300 border-blue-800',
  AI:         'bg-indigo-900/50 text-indigo-300 border-indigo-800',
  Health:     'bg-green-900/50 text-green-300 border-green-800',
  Fitness:    'bg-orange-900/50 text-orange-300 border-orange-800',
  Business:   'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  General:    'bg-gray-800 text-gray-400 border-gray-700',
};

interface PromptLibraryScreenProps {
  onBack: () => void;
}

export function PromptLibraryScreen({ onBack }: PromptLibraryScreenProps) {
  const { customPrompts, isLoading, loadPrompts, deletePrompt, allPrompts } =
    usePromptLibraryStore();

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PromptTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const allP = allPrompts();
  const filtered = allP.filter((p) => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const customCount = customPrompts.length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold">Prompt Library</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {allP.length} prompts · {customCount} custom
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          + New Prompt
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  category === cat
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt list */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg font-medium text-gray-400">No prompts found</p>
            <p className="text-sm mt-2">Try a different search or category, or create a new prompt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                expanded={expandedId === prompt.id}
                onToggle={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                onEdit={() => setEditing(prompt)}
                onDelete={() => deletePrompt(prompt.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create / edit modal */}
      {(creating || editing) && (
        <PromptEditorModal
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prompt card
// ---------------------------------------------------------------------------
interface PromptCardProps {
  prompt: PromptTemplate;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PromptCard({ prompt, expanded, onToggle, onEdit, onDelete }: PromptCardProps) {
  const [confirming, setConfirming] = useState(false);
  const catStyle = CATEGORY_COLORS[prompt.category] ?? CATEGORY_COLORS.General;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-semibold text-white">{prompt.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${catStyle}`}>
              {prompt.category}
            </span>
            {prompt.isBuiltIn && (
              <span className="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-500 font-medium">
                built-in
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{prompt.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggle}
            className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {expanded ? 'Hide' : 'Preview'}
          </button>
          {!prompt.isBuiltIn && (
            <>
              <button
                onClick={onEdit}
                className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Edit
              </button>
              {confirming ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => { onDelete(); setConfirming(false); }}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-xs text-gray-500 hover:text-gray-400 px-2 py-1 rounded"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="text-xs text-gray-600 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded prompt text */}
      {expanded && (
        <div className="mt-4 bg-gray-950 border border-gray-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
            System Prompt
          </p>
          <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
            {prompt.role}
          </p>
        </div>
      )}
    </div>
  );
}
