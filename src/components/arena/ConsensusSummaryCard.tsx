'use client';

import { formatCost } from '@/lib/cost-calculator';
import type { DebaterConfig, TurnCost } from '@/lib/types';

interface ConsensusSummaryCardProps {
  topic: string;
  summary: string;
  debaters: DebaterConfig[];
  turnCosts: TurnCost[];
  totalCost: number;
  onNewDebate: () => void;
}

/** Minimal inline markdown renderer — handles the subset the LLM produces */
function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n');

  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key} className="list-disc list-inside space-y-0.5 pl-2 mb-2">
        {listItems.map((item, i) => (
          <li key={i} className="text-sm text-gray-200 leading-relaxed">
            <InlineMarkdown text={item} />
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, i) => {
    const key = `line-${i}`;

    if (line.startsWith('## ')) {
      flushList(`flush-${i}`);
      elements.push(
        <h2 key={key} className="text-base font-bold text-green-300 mt-4 mb-1 first:mt-0">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList(`flush-${i}`);
      elements.push(
        <h3 key={key} className="text-sm font-bold text-green-400 mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    } else if (line.match(/^[-*] /) || line.match(/^\d+\. /)) {
      // list item
      const text = line.replace(/^[-*] /, '').replace(/^\d+\. /, '');
      listItems.push(text);
    } else if (line.trim() === '') {
      flushList(`flush-${i}`);
      // skip blank lines (spacing handled by margins)
    } else {
      flushList(`flush-${i}`);
      elements.push(
        <p key={key} className="text-sm text-gray-200 leading-relaxed mb-1">
          <InlineMarkdown text={line} />
        </p>
      );
    }
  });
  flushList('flush-end');

  return <>{elements}</>;
}

/** Renders **bold** inline */
function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function ConsensusSummaryCard({
  topic,
  summary,
  debaters,
  turnCosts,
  totalCost,
  onNewDebate,
}: ConsensusSummaryCardProps) {
  const costByDebater = debaters.map((d) => {
    const total = turnCosts
      .filter((t) => t.debaterId === d.id)
      .reduce((sum, t) => sum + t.cost, 0);
    return { name: d.name, side: d.side, cost: total };
  });

  // Detect if this is a full architecture document (has markdown headers)
  const isArchitectureDoc = summary.includes('##');

  return (
    <div className="border-t border-green-800 bg-green-950/20 px-6 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-green-400 text-lg">✓</span>
        <h2 className="text-base font-bold text-green-400">
          {isArchitectureDoc ? 'Final Architecture' : 'Final Consensus'}
        </h2>
      </div>

      <p className="text-xs text-gray-500 italic">&ldquo;{topic}&rdquo;</p>

      <div className={isArchitectureDoc ? 'max-h-[60vh] overflow-y-auto pr-1' : ''}>
        {isArchitectureDoc ? (
          <MarkdownBlock text={summary} />
        ) : (
          <p className="text-sm text-gray-200 leading-relaxed">{summary}</p>
        )}
      </div>

      {/* Cost breakdown */}
      <div className="border-t border-gray-800 pt-3">
        <p className="text-xs text-gray-500 mb-2 font-semibold">Cost Breakdown</p>
        <div className="space-y-1">
          {costByDebater.map((d) => (
            <div key={d.name} className="flex justify-between text-xs">
              <span className="text-gray-400">{d.name}</span>
              <span className="text-gray-500 font-mono">{formatCost(d.cost)}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs font-semibold border-t border-gray-800 pt-1 mt-1">
            <span className="text-gray-300">Total</span>
            <span className="text-white font-mono">{formatCost(totalCost)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNewDebate}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-sm"
      >
        + Start New Debate
      </button>
    </div>
  );
}
