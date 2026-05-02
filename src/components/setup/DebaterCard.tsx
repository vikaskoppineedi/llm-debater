'use client';

import { useEffect, useState } from 'react';
import type { DebaterConfig, ProviderName, DebaterSide, PromptTemplate } from '@/lib/types';
import { DEFAULT_ROLE } from '@/lib/system-prompts';
import { useCredentialsStore } from '@/store/credentials-store';
import { usePromptLibraryStore } from '@/store/prompt-library-store';

interface DebaterCardProps {
  debater: DebaterConfig;
  canRemove: boolean;
  onUpdate: (patch: Partial<DebaterConfig>) => void;
  onRemove: () => void;
}

const PROVIDER_LABELS: Record<ProviderName, string> = {
  claude: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
  ollama: 'Ollama (Local)',
};

const sideOptions: { value: DebaterSide; label: string; color: string }[] = [
  { value: 'pro', label: 'PRO', color: 'bg-blue-600 hover:bg-blue-500' },
  { value: 'con', label: 'CON', color: 'bg-red-600 hover:bg-red-500' },
  { value: 'neutral', label: 'NEUTRAL', color: 'bg-purple-600 hover:bg-purple-500' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Technology: 'text-blue-400',
  AI:         'text-indigo-400',
  Health:     'text-green-400',
  Fitness:    'text-orange-400',
  Business:   'text-yellow-400',
  General:    'text-gray-400',
};

// ---------------------------------------------------------------------------
// Prompt picker panel (inline overlay inside the card)
// ---------------------------------------------------------------------------
interface PromptPickerProps {
  onSelect: (prompt: PromptTemplate) => void;
  onClose: () => void;
}

function PromptPicker({ onSelect, onClose }: PromptPickerProps) {
  const { allPrompts, loadPrompts, isLoading } = usePromptLibraryStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const categories = ['All', 'Technology', 'AI', 'Health', 'Fitness', 'Business', 'General'];
  const prompts = allPrompts().filter((p) => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="mt-3 bg-gray-950 border border-indigo-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <p className="text-xs font-semibold text-indigo-400">Select from Library</p>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xs">✕</button>
      </div>

      {/* Search */}
      <div className="px-3 pt-2 pb-1">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          autoFocus
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-2 py-1 rounded text-xs font-semibold border transition-colors ${
              category === cat
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'border-gray-700 text-gray-500 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-800">
        {isLoading ? (
          <p className="text-xs text-gray-500 px-3 py-4 text-center">Loading…</p>
        ) : prompts.length === 0 ? (
          <p className="text-xs text-gray-500 px-3 py-4 text-center">No prompts match</p>
        ) : (
          prompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => { onSelect(prompt); onClose(); }}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{prompt.name}</span>
                <span className={`text-xs ${CATEGORY_COLORS[prompt.category] ?? 'text-gray-500'}`}>
                  {prompt.category}
                </span>
                {prompt.isBuiltIn && (
                  <span className="text-xs text-gray-600">built-in</span>
                )}
              </div>
              {prompt.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{prompt.description}</p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Debater card
// ---------------------------------------------------------------------------
export function DebaterCard({ debater, canRemove, onUpdate, onRemove }: DebaterCardProps) {
  const [showRole, setShowRole] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const creds = useCredentialsStore();

  const modelsForProvider: Record<ProviderName, string[]> = {
    claude: creds.claudeModels,
    gemini: creds.geminiModels,
    ollama: creds.ollamaModels,
  };

  const availableModels = modelsForProvider[debater.provider];

  const handleProviderChange = (provider: ProviderName) => {
    const models = modelsForProvider[provider];
    onUpdate({ provider, model: models[0] ?? '' });
  };

  const handlePickPrompt = (prompt: PromptTemplate) => {
    // Apply the prompt's role AND update the name if it's still a default "Debater X" name
    const nameIsDefault = /^Debater [A-Z]$/.test(debater.name);
    onUpdate({
      role: prompt.role,
      ...(nameIsDefault ? { name: prompt.name } : {}),
    });
    setShowRole(true); // expand so user can see what was applied
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      {/* Name + Remove */}
      <div className="flex items-center gap-3">
        <input
          value={debater.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Debater name"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-gray-600 hover:text-red-400 transition-colors text-sm px-2"
            title="Remove debater"
          >
            ✕
          </button>
        )}
      </div>

      {/* Provider + Model */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Provider</label>
          <select
            value={debater.provider}
            onChange={(e) => handleProviderChange(e.target.value as ProviderName)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            {(Object.keys(PROVIDER_LABELS) as ProviderName[]).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          {availableModels.length === 0 ? (
            <div className="bg-gray-800 border border-amber-800 rounded-lg px-3 py-2 text-amber-500 text-xs">
              Not configured — set up in Settings
            </div>
          ) : (
            <select
              value={debater.model || availableModels[0]}
              onChange={(e) => onUpdate({ model: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Side selector */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Side</label>
        <div className="flex gap-2">
          {sideOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ side: opt.value })}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                debater.side === opt.value
                  ? opt.color + ' text-white'
                  : 'bg-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* System prompt (collapsible) + Library picker */}
      <div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRole((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <span>{showRole ? '▼' : '▶'}</span>
            <span>System Prompt / Expert Persona</span>
          </button>
          <button
            onClick={() => { setShowPicker((v) => !v); setShowRole(true); }}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            📚 Pick from Library
          </button>
        </div>

        {showRole && (
          <textarea
            value={debater.role}
            onChange={(e) => onUpdate({ role: e.target.value })}
            rows={4}
            placeholder={DEFAULT_ROLE}
            className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-xs focus:outline-none focus:border-indigo-500 resize-y font-mono"
          />
        )}

        {showPicker && (
          <PromptPicker
            onSelect={handlePickPrompt}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
