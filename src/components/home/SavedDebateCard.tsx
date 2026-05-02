'use client';

import { useState } from 'react';
import { formatCost } from '@/lib/cost-calculator';
import { exportDebateHtml } from '@/lib/export-html';
import type { SavedDebate } from '@/lib/types';

interface SavedDebateCardProps {
  debate: SavedDebate;
  onView: () => void;
  onContinue?: () => void;
  onDelete: () => void;
}

const SIDE_COLOR: Record<string, string> = {
  pro: 'text-blue-400',
  con: 'text-red-400',
  neutral: 'text-purple-400',
};

export function SavedDebateCard({ debate, onView, onContinue, onDelete }: SavedDebateCardProps) {
  const [confirming, setConfirming] = useState(false);
  const date = new Date(debate.savedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">&ldquo;{debate.topic}&rdquo;</p>
          <p className="text-sm text-gray-400 mt-1">
            {debate.debaters.map((d, i) => (
              <span key={d.id}>
                {i > 0 && <span className="text-gray-600 mx-1">·</span>}
                <span className={SIDE_COLOR[d.side] ?? 'text-gray-300'}>
                  {d.name}
                </span>
              </span>
            ))}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {debate.completedRounds}/{debate.totalRounds} rounds · {date} ·{' '}
            {formatCost(debate.totalCost)}
            {debate.status === 'stopped' && (
              <span className="ml-2 text-yellow-600">stopped early</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onView}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            View
          </button>
          {onContinue && debate.status === 'stopped' && (
            <button
              onClick={onContinue}
              className="text-sm text-green-400 hover:text-green-300 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              ▶ Continue
            </button>
          )}
          <button
            onClick={() => exportDebateHtml(debate)}
            className="text-sm text-gray-400 hover:text-green-400 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            title="Export as HTML"
          >
            ↓ HTML
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
              className="text-sm text-gray-600 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
