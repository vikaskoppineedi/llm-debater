'use client';

import { useState } from 'react';
import { useDebateStore } from '@/store/debate-store';
import { HomeScreen } from '@/components/home/HomeScreen';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { SetupScreen } from '@/components/setup/SetupScreen';
import { DebateArena } from '@/components/arena/DebateArena';
import { HistoryScreen } from '@/components/history/HistoryScreen';
import { PromptLibraryScreen } from '@/components/prompt-library/PromptLibraryScreen';
import { MessageBubble } from '@/components/arena/MessageBubble';
import { exportDebateHtml } from '@/lib/export-html';
import type { SavedDebate } from '@/lib/types';

type Screen = 'home' | 'history' | 'prompt-library' | 'settings' | 'setup' | 'arena' | 'view';

export default function Page() {
  const [screen, setScreen] = useState<Screen>('home');
  const [prevScreen, setPrevScreen] = useState<Screen>('home');
  const [viewingDebate, setViewingDebate] = useState<SavedDebate | null>(null);
  const loadSavedDebate = useDebateStore((s) => s.loadSavedDebate);
  const setStatus = useDebateStore((s) => s.setStatus);

  const goToSettings = () => {
    setPrevScreen(screen);
    setScreen('settings');
  };

  const handleStartDebate = () => {
    setStatus('running');
    setScreen('arena');
  };

  const handleViewDebate = (debate: SavedDebate) => {
    setViewingDebate(debate);
    setScreen('view');
  };

  const handleContinueDebate = (debate: SavedDebate) => {
    loadSavedDebate(debate);
    setScreen('arena');
  };

  if (screen === 'home') {
    return (
      <HomeScreen
        onNewDebate={() => setScreen('setup')}
        onViewDebate={handleViewDebate}
        onContinueDebate={handleContinueDebate}
        onViewHistory={() => setScreen('history')}
        onPromptLibrary={() => { setPrevScreen('home'); setScreen('prompt-library'); }}
        onSettings={goToSettings}
      />
    );
  }

  if (screen === 'history') {
    return (
      <HistoryScreen
        onBack={() => setScreen('home')}
        onViewDebate={handleViewDebate}
        onContinueDebate={handleContinueDebate}
      />
    );
  }

  if (screen === 'prompt-library') {
    return (
      <PromptLibraryScreen onBack={() => setScreen(prevScreen)} />
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen onBack={() => setScreen(prevScreen)} />
    );
  }

  if (screen === 'setup') {
    return (
      <SetupScreen
        onStart={handleStartDebate}
        onBack={() => setScreen('home')}
        onSettings={goToSettings}
        onPromptLibrary={() => { setPrevScreen('setup'); setScreen('prompt-library'); }}
      />
    );
  }

  if (screen === 'arena') {
    return (
      <DebateArena
        onNewDebate={() => setScreen('home')}
        onGoHome={() => setScreen('home')}
      />
    );
  }

  if (screen === 'view' && viewingDebate) {
    return (
      <div className="h-screen flex flex-col bg-gray-950 text-white">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => { setViewingDebate(null); setScreen('home'); }}
            className="text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate max-w-xl">
              &ldquo;{viewingDebate.topic}&rdquo;
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {viewingDebate.completedRounds}/{viewingDebate.totalRounds} rounds ·{' '}
              {viewingDebate.status}
            </p>
          </div>
          <button
            onClick={() => exportDebateHtml(viewingDebate)}
            className="text-sm text-gray-400 hover:text-green-400 font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shrink-0"
          >
            ↓ Export HTML
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {viewingDebate.transcript.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {viewingDebate.consensusSummary && (
          <div className="border-t border-green-800 bg-green-950/20 px-6 py-4">
            <p className="text-xs font-semibold text-green-400 mb-3">
              {viewingDebate.consensusSummary.includes('##') ? 'Final Architecture' : 'Final Consensus'}
            </p>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {viewingDebate.consensusSummary}
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
