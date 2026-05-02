'use client';

import { useDebateStore } from '@/store/debate-store';
import { useDebateOrchestrator } from '@/lib/debate-orchestrator';
import { DebateHeader } from './DebateHeader';
import { TranscriptPane } from './TranscriptPane';
import { DebateControls } from './DebateControls';
import { ClientInterruptPanel } from './ClientInterruptPanel';
import { ConsensusSummaryCard } from './ConsensusSummaryCard';
import { useState } from 'react';

interface DebateArenaProps {
  onNewDebate: () => void;
  onGoHome: () => void;
}

export function DebateArena({ onNewDebate, onGoHome }: DebateArenaProps) {
  const config = useDebateStore((s) => s.config);
  const status = useDebateStore((s) => s.status);
  const currentRound = useDebateStore((s) => s.currentRound);
  const transcript = useDebateStore((s) => s.transcript);
  const turnCosts = useDebateStore((s) => s.turnCosts);
  const totalCost = useDebateStore((s) => s.totalCost);
  const consensusSummary = useDebateStore((s) => s.consensusSummary);
  const error = useDebateStore((s) => s.error);
  const setError = useDebateStore((s) => s.setError);
  const getCurrentDebater = useDebateStore((s) => s.getCurrentDebater);

  const orchestrator = useDebateOrchestrator();
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await orchestrator.saveCurrentDebate();
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  if (!config) return null;

  const currentDebater = getCurrentDebater();

  const handleNewDebate = () => {
    orchestrator.newDebate();
    onNewDebate();
  };

  const handleStop = () => {
    orchestrator.stop();
    onNewDebate();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      <DebateHeader
        topic={config.topic}
        currentRound={currentRound}
        totalRounds={config.totalRounds}
        currentDebater={currentDebater}
        status={status}
        totalCost={totalCost}
      />

      {/* Toolbar: home + save buttons */}
      <div className="border-b border-gray-800 px-6 py-1.5 flex items-center justify-between gap-3">
        <button
          onClick={onGoHome}
          className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800"
        >
          ⌂ Home
        </button>
        <button
          onClick={handleSave}
          disabled={saving || transcript.length === 0}
          className="text-xs text-gray-500 hover:text-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-gray-800"
        >
          {saving ? 'Saving…' : savedMsg ? '✓ Saved' : '↓ Save to History'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-800 px-6 py-2 flex items-center justify-between">
          <p className="text-sm text-red-300">⚠ {error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      <TranscriptPane
        messages={transcript}
        onDeleteMessage={orchestrator.deleteMessage}
      />

      {/* Consensus summary */}
      {status === 'completed' && consensusSummary && (
        <ConsensusSummaryCard
          topic={config.topic}
          summary={consensusSummary}
          debaters={config.debaters}
          turnCosts={turnCosts}
          totalCost={totalCost}
          onNewDebate={handleNewDebate}
        />
      )}

      {/* Client panel — shown when interrupted (mid-turn) or paused (end of round) */}
      {(status === 'interrupted' || status === 'paused') && (
        <ClientInterruptPanel
          debaters={config.debaters}
          mode={status === 'paused' ? 'round_end' : 'interrupt'}
          onSubmit={orchestrator.submitClientInput}
          onCancel={orchestrator.resume}
        />
      )}

      {/* Controls */}
      {status !== 'stopped' && (
        <DebateControls
          status={status}
          onPause={orchestrator.pause}
          onResume={orchestrator.resume}
          onInterrupt={orchestrator.interrupt}
          onReachConclusion={orchestrator.reachConclusion}
          onExtendRounds={orchestrator.extendRounds}
          onStop={handleStop}
          onNewDebate={handleNewDebate}
        />
      )}
    </div>
  );
}
