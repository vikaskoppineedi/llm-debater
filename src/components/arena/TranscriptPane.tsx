'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { DebateMessage } from '@/lib/types';

interface TranscriptPaneProps {
  messages: DebateMessage[];
  onDeleteMessage?: (id: string) => void;
}

export function TranscriptPane({ messages, onDeleteMessage }: TranscriptPaneProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages.at(-1)?.text]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        Debate will begin shortly...
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto py-6 space-y-4">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id) : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
