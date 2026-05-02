'use client';

import { useState } from 'react';
import type { DebaterConfig } from '@/lib/types';

interface ClientInterruptPanelProps {
  debaters: DebaterConfig[];
  mode: 'interrupt' | 'round_end';
  onSubmit: (text: string, targetDebaterId: string | 'all') => void;
  onCancel: () => void;
}

const SIDE_STYLE: Record<string, string> = {
  pro: 'border-blue-700 text-blue-400 hover:bg-blue-950',
  con: 'border-red-700 text-red-400 hover:bg-red-950',
  neutral: 'border-purple-700 text-purple-400 hover:bg-purple-950',
};

export function ClientInterruptPanel({ debaters, mode, onSubmit, onCancel }: ClientInterruptPanelProps) {
  const [text, setText] = useState('');
  const [target, setTarget] = useState<string | 'all'>('all');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim(), target);
    setText('');
  };

  const isRoundEnd = mode === 'round_end';

  return (
    <div className={`border-t px-6 py-4 space-y-3 ${isRoundEnd ? 'border-indigo-800 bg-indigo-950/30' : 'border-amber-800 bg-amber-950/30'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${isRoundEnd ? 'text-indigo-400' : 'text-amber-400'}`}>
        {isRoundEnd ? 'Round complete — add a comment before continuing (optional)' : 'Your Directive'}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isRoundEnd ? 'Add your thoughts, redirect the debate, or just continue...' : 'Type your directive to the models...'}
        rows={2}
        autoFocus={!isRoundEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
        className={`w-full bg-gray-900 border rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none resize-none text-sm ${isRoundEnd ? 'border-indigo-800 focus:border-indigo-600' : 'border-amber-800 focus:border-amber-600'}`}
      />

      {/* Target selector */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Send to:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTarget('all')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              target === 'all'
                ? 'bg-amber-700 border-amber-600 text-white'
                : 'border-amber-800 text-amber-500 hover:bg-amber-900/40'
            }`}
          >
            All Models
          </button>
          {debaters.map((d) => (
            <button
              key={d.id}
              onClick={() => setTarget(d.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                target === d.id
                  ? 'bg-gray-700 border-gray-500 text-white'
                  : SIDE_STYLE[d.side] ?? 'border-gray-700 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {d.name}{' '}
              <span className="opacity-60 text-xs uppercase">({d.side})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className={`px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors ${isRoundEnd ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-amber-600 hover:bg-amber-500'}`}
        >
          {isRoundEnd ? 'Send & Continue' : 'Send'}
        </button>
        <button
          onClick={onCancel}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${isRoundEnd ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          {isRoundEnd ? '▶ Continue' : 'Cancel — resume without input'}
        </button>
      </div>
      <p className="text-xs text-gray-600">Tip: Cmd+Enter to send</p>
    </div>
  );
}
