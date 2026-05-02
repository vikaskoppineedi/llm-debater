'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useDebateStore } from '@/store/debate-store';
import { useCredentialsStore } from '@/store/credentials-store';
import { DEFAULT_ROLE } from '@/lib/system-prompts';
import { DebaterCard } from './DebaterCard';
import type { DebaterConfig, DebateConfig } from '@/lib/types';

interface SetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  onSettings: () => void;
  onPromptLibrary: () => void;
}

function makeDebater(name: string, side: DebaterConfig['side']): DebaterConfig {
  return {
    id: nanoid(),
    name,
    provider: 'claude',
    model: '',
    side,
    role: DEFAULT_ROLE,
  };
}

export function SetupScreen({ onStart, onBack, onSettings, onPromptLibrary }: SetupScreenProps) {
  const setConfig = useDebateStore((s) => s.setConfig);
  const persistedConfig = useDebateStore((s) => s.config);
  const creds = useCredentialsStore();

  const [topic, setTopic] = useState(persistedConfig?.topic ?? '');
  const [rounds, setRounds] = useState(persistedConfig?.totalRounds ?? 5);
  const [debaters, setDebaters] = useState<DebaterConfig[]>(
    persistedConfig?.debaters ?? [
      makeDebater('Debater A', 'pro'),
      makeDebater('Debater B', 'con'),
    ]
  );

  const updateDebater = (id: string, patch: Partial<DebaterConfig>) => {
    setDebaters((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const addDebater = () => {
    const names = ['C', 'D', 'E', 'F', 'G', 'H'];
    const idx = debaters.length - 2;
    const label = names[idx] ?? String(debaters.length + 1);
    setDebaters((prev) => [...prev, makeDebater(`Debater ${label}`, 'con')]);
  };

  const removeDebater = (id: string) => {
    if (debaters.length <= 2) return;
    setDebaters((prev) => prev.filter((d) => d.id !== id));
  };

  const modelsFor = (provider: DebaterConfig['provider']) => {
    if (provider === 'claude') return creds.claudeModels;
    if (provider === 'gemini') return creds.geminiModels;
    return creds.ollamaModels;
  };

  const missingConfig = debaters.some((d) => modelsFor(d.provider).length === 0);

  const canStart =
    topic.trim().length > 0 &&
    debaters.length >= 2 &&
    !missingConfig;

  const handleStart = () => {
    // Ensure each debater has a model set (default to first available)
    const resolved = debaters.map((d) => ({
      ...d,
      model: d.model || modelsFor(d.provider)[0] || '',
    }));
    const config: DebateConfig = {
      topic: topic.trim(),
      totalRounds: rounds,
      debaters: resolved,
    };
    setConfig(config);
    onStart();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">New Debate</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onPromptLibrary}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            📚 Library
          </button>
          <button
            onClick={onSettings}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-8">
        {/* Topic */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Debate Topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Microservices are better than monoliths for large-scale systems"
            rows={9}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-y text-sm"
          />
        </div>

        {/* Rounds */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Rounds: <span className="text-indigo-400 font-bold">{rounds}</span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>1</span><span>20</span>
          </div>
        </div>

        {/* Debaters */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-300">Debaters</label>
            <button
              onClick={addDebater}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              + Add Debater
            </button>
          </div>
          <div className="space-y-4">
            {debaters.map((debater) => (
              <DebaterCard
                key={debater.id}
                debater={debater}
                canRemove={debaters.length > 2}
                onUpdate={(patch) => updateDebater(debater.id, patch)}
                onRemove={() => removeDebater(debater.id)}
              />
            ))}
          </div>
        </div>

        {/* Start */}
        <div className="pt-2">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-base"
          >
            Start Debate
          </button>
          {!canStart && topic.trim().length === 0 && (
            <p className="text-xs text-gray-600 mt-2 text-center">Enter a topic to continue</p>
          )}
          {!canStart && topic.trim().length > 0 && missingConfig && (
            <p className="text-xs text-amber-500 mt-2 text-center">
              One or more providers not configured —{' '}
              <button onClick={onSettings} className="underline hover:text-amber-400">
                open Settings
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
