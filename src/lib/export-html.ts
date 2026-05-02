import type { SavedDebate, DebateMessage } from './types';
import { formatCost } from './cost-calculator';

const ROLE_STYLE: Record<string, { bg: string; border: string; label: string; align: string }> = {
  pro:     { bg: '#1e3a5f', border: '#2563eb', label: 'PRO',     align: 'left'   },
  con:     { bg: '#3f1e1e', border: '#dc2626', label: 'CON',     align: 'right'  },
  neutral: { bg: '#2d1f4e', border: '#7c3aed', label: 'NEUTRAL', align: 'center' },
  client:  { bg: '#3d2e0a', border: '#d97706', label: 'CLIENT',  align: 'center' },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function renderMessage(msg: DebateMessage): string {
  const style = ROLE_STYLE[msg.role] ?? ROLE_STYLE.neutral;
  const roundLabel = msg.round > 0 ? `Round ${msg.round}` : 'Client';
  const targetLabel = msg.targetDebaterId
    ? ` → ${msg.targetDebaterId === 'all' ? 'All' : msg.targetDebaterId}`
    : '';

  return `
    <div style="display:flex; justify-content:${style.align === 'right' ? 'flex-end' : style.align === 'center' ? 'center' : 'flex-start'}; margin-bottom:16px;">
      <div style="max-width:72%; background:${style.bg}; border:1px solid ${style.border}; border-radius:12px; padding:14px 18px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span style="background:${style.border}; color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:0.05em;">${style.label}</span>
          <span style="color:#e5e7eb; font-weight:600; font-size:13px;">${escapeHtml(msg.debaterName)}${targetLabel}</span>
          <span style="color:#6b7280; font-size:11px; margin-left:auto;">${roundLabel}</span>
        </div>
        <p style="color:#f3f4f6; font-size:14px; line-height:1.65; margin:0;">${escapeHtml(msg.text)}</p>
      </div>
    </div>`;
}

function generateHtml(debate: SavedDebate): string {
  const date = new Date(debate.savedAt).toLocaleString();
  const debaterList = debate.debaters
    .map((d) => `<span style="color:${d.side === 'pro' ? '#60a5fa' : d.side === 'con' ? '#f87171' : '#a78bfa'}; font-weight:600;">${d.name} (${d.side.toUpperCase()}, ${d.provider}/${d.model})</span>`)
    .join('<span style="color:#4b5563"> · </span>');

  const messages = debate.transcript.map(renderMessage).join('');

  const summaryBlock = debate.consensusSummary ? `
    <div style="border:1px solid #166534; background:#052e16; border-radius:12px; padding:20px 24px; margin-top:32px;">
      <p style="color:#4ade80; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin:0 0 10px;">✓ Final Consensus</p>
      <p style="color:#d1fae5; font-size:14px; line-height:1.7; margin:0;">${escapeHtml(debate.consensusSummary)}</p>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale:1.0">
  <title>Debate: ${escapeHtml(debate.topic)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #030712; color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 0; }
    .header { border-bottom: 1px solid #1f2937; padding: 24px 40px; }
    .header h1 { font-size: 20px; font-weight: 700; color: #f9fafb; margin-bottom: 8px; }
    .meta { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
    .transcript { max-width: 900px; margin: 0 auto; padding: 32px 40px; }
    @media print { body { background: #fff; color: #111; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>&ldquo;${escapeHtml(debate.topic)}&rdquo;</h1>
    <p class="meta">${debaterList}</p>
    <p class="meta">${debate.completedRounds}/${debate.totalRounds} rounds &nbsp;·&nbsp; ${date} &nbsp;·&nbsp; ${formatCost(debate.totalCost)} &nbsp;·&nbsp; ${debate.status}</p>
  </div>
  <div class="transcript">
    ${messages}
    ${summaryBlock}
  </div>
</body>
</html>`;
}

export function exportDebateHtml(debate: SavedDebate): void {
  const html = generateHtml(debate);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const slug = debate.topic.slice(0, 40).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  a.download = `debate-${slug}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
