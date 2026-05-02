'use client';

import { useState } from 'react';
import type { DebateMessage } from '@/lib/types';

interface MessageBubbleProps {
  message: DebateMessage;
  onDelete?: () => void;
}

const ROLE_STYLES = {
  pro: {
    container: 'justify-start',
    bubble: 'bg-blue-950 border border-blue-800 rounded-2xl rounded-tl-sm',
    header: 'text-blue-400',
    badge: 'bg-blue-900 text-blue-300',
  },
  con: {
    container: 'justify-end',
    bubble: 'bg-red-950 border border-red-800 rounded-2xl rounded-tr-sm',
    header: 'text-red-400',
    badge: 'bg-red-900 text-red-300',
  },
  neutral: {
    container: 'justify-center',
    bubble: 'bg-purple-950 border border-purple-800 rounded-2xl',
    header: 'text-purple-400',
    badge: 'bg-purple-900 text-purple-300',
  },
  client: {
    container: 'justify-center',
    bubble: 'bg-amber-950 border border-amber-700 rounded-2xl',
    header: 'text-amber-400',
    badge: 'bg-amber-900 text-amber-300',
  },
};

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const styles = ROLE_STYLES[message.role] ?? ROLE_STYLES.neutral;
  const isClient = message.role === 'client';

  return (
    <div
      className={`flex ${styles.container} px-4 group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`max-w-[75%] ${isClient ? 'w-full max-w-lg' : ''} relative`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1 ${message.role === 'con' ? 'flex-row-reverse' : ''}`}>
          <span className={`text-xs font-bold ${styles.header}`}>{message.debaterName}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold uppercase ${styles.badge}`}>
            {message.role === 'client'
              ? message.targetDebaterId === 'all'
                ? 'You → All'
                : `You → ${message.targetDebaterId ?? 'All'}`
              : message.role}
          </span>
          {message.round > 0 && (
            <span className="text-xs text-gray-600">Round {message.round}</span>
          )}
          {/* Delete button — shown on hover, not during streaming */}
          {onDelete && !message.isStreaming && hovered && (
            <button
              onClick={onDelete}
              title="Delete message"
              className="text-xs text-gray-600 hover:text-red-400 transition-colors ml-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Bubble */}
        <div className={`${styles.bubble} px-4 py-3`}>
          <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
            {message.text}
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-white ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
