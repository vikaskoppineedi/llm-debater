'use client';

import { useState } from 'react';
import type { DebateStatus } from '@/lib/types';

interface DebateControlsProps {
  status: DebateStatus;
  onPause: () => void;
  onResume: () => void;
  onInterrupt: () => void;
  onReachConclusion: () => void;
  onExtendRounds: (extra: number) => void;
  onStop: () => void;
  onNewDebate: () => void;
}

export function DebateControls({
  status,
  onPause,
  onResume,
  onInterrupt,
  onReachConclusion,
  onExtendRounds,
  onStop,
  onNewDebate,
}: DebateControlsProps) {
  const [confirmStop, setConfirmStop] = useState(false);

  const isActive = status === 'running' || status === 'concluding';
  const isPaused = status === 'paused';
  const isInterrupted = status === 'interrupted';
  const isStopped = status === 'stopped' || status === 'completed';

  if (status === 'stopped') return null;

  return (
    <div className="border-t border-gray-800 px-6 py-3 flex items-center gap-3 flex-wrap bg-gray-950">
      {/* Pause / Resume */}
      {isActive && (
        <button
          onClick={onPause}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          ⏸ Pause
        </button>
      )}
      {(isPaused) && (
        <button
          onClick={onResume}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          ▶ Resume
        </button>
      )}

      {/* Interrupt */}
      {(isActive || isPaused) && !isInterrupted && (
        <button
          onClick={onInterrupt}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          ✋ Interrupt
        </button>
      )}

      {/* Reach Conclusion */}
      {(isActive || isPaused) && (
        <button
          onClick={onReachConclusion}
          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          ⚡ Reach Conclusion
        </button>
      )}

      {/* Extend Rounds */}
      {(isActive || isPaused || isStopped) && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 mr-1">Extend:</span>
          {[5, 10].map((n) => (
            <button
              key={n}
              onClick={() => onExtendRounds(n)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
            >
              +{n}
            </button>
          ))}
        </div>
      )}

      {/* Stop */}
      {!confirmStop ? (
        <button
          onClick={() => setConfirmStop(true)}
          className="px-4 py-2 text-gray-600 hover:text-red-400 text-sm font-medium transition-colors ml-auto"
        >
          ■ Stop
        </button>
      ) : (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">Stop debate?</span>
          <button
            onClick={() => { onStop(); setConfirmStop(false); }}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Yes, stop
          </button>
          <button
            onClick={() => setConfirmStop(false)}
            className="px-3 py-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* New Debate */}
      <button
        onClick={onNewDebate}
        className="px-4 py-2 text-gray-600 hover:text-indigo-400 text-sm font-medium transition-colors"
      >
        + New Debate
      </button>
    </div>
  );
}
