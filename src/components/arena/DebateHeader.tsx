'use client';

import { formatCost } from '@/lib/cost-calculator';
import type { DebaterConfig, DebateStatus } from '@/lib/types';

interface DebateHeaderProps {
  topic: string;
  currentRound: number;
  totalRounds: number;
  currentDebater: DebaterConfig | null;
  status: DebateStatus;
  totalCost: number;
}

const STATUS_DOT: Record<DebateStatus, string> = {
  idle: 'bg-gray-500',
  running: 'bg-green-400 animate-pulse',
  paused: 'bg-yellow-400',
  interrupted: 'bg-amber-400',
  concluding: 'bg-indigo-400 animate-pulse',
  stopped: 'bg-red-500',
  completed: 'bg-green-500',
};

const SIDE_COLOR: Record<string, string> = {
  pro: 'text-blue-400 bg-blue-950 border-blue-800',
  con: 'text-red-400 bg-red-950 border-red-800',
  neutral: 'text-purple-400 bg-purple-950 border-purple-800',
};

export function DebateHeader({
  topic,
  currentRound,
  totalRounds,
  currentDebater,
  status,
  totalCost,
}: DebateHeaderProps) {
  const round = Math.min(currentRound, totalRounds);
  const turnsLeft = Math.max(0, totalRounds - currentRound + 1);
  const pct = currentRound / totalRounds;

  // Countdown color and label
  const countdownColor =
    pct >= 1.0 || turnsLeft <= 1
      ? 'text-red-400'
      : pct > 0.80
      ? 'text-orange-400'
      : pct > 0.60
      ? 'text-amber-400'
      : 'text-gray-500';

  const countdownLabel =
    status === 'completed'
      ? 'Complete'
      : status === 'stopped'
      ? 'Stopped'
      : turnsLeft <= 1
      ? 'Final turn'
      : pct > 0.80
      ? `${turnsLeft} turns left — converging`
      : pct > 0.60
      ? `${turnsLeft} turns left — find common ground`
      : `${turnsLeft} turns left`;

  return (
    <div className="border-b border-gray-800 px-6 py-4 bg-gray-950">
      {/* Topic */}
      <p className="text-sm text-gray-400 truncate max-w-2xl" title={topic}>
        &ldquo;{topic}&rdquo;
      </p>

      {/* Status row */}
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
          <span className="text-xs text-gray-500 capitalize">{status}</span>
        </div>

        {/* Round */}
        <span className="text-xs text-gray-500">
          Round{' '}
          <span className="text-white font-semibold">{round}</span>
          {' '}of{' '}
          <span className="text-white font-semibold">{totalRounds}</span>
        </span>

        {/* Turns remaining countdown */}
        <span className={`text-xs font-semibold ${countdownColor}`}>
          {countdownLabel}
        </span>

        {/* Current speaker */}
        {currentDebater && (status === 'running' || status === 'concluding') && (
          <span
            className={`text-xs px-2 py-0.5 rounded border font-semibold ${
              SIDE_COLOR[currentDebater.side] ?? 'text-gray-400'
            }`}
          >
            {currentDebater.name} speaking...
          </span>
        )}

        {/* Cost */}
        <span className="ml-auto text-xs text-gray-600">
          Est. cost:{' '}
          <span className="text-gray-400 font-mono">{formatCost(totalCost)}</span>
        </span>
      </div>
    </div>
  );
}
