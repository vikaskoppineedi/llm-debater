import { streamClaude } from '@/lib/providers/claude';
import { streamGemini } from '@/lib/providers/gemini';
import { streamOllama } from '@/lib/providers/ollama';
import type { StreamRequestBody, ProviderName } from '@/lib/types';

/** Turn raw SDK errors into short, human-readable messages */
function formatProviderError(err: unknown, provider: ProviderName): string {
  const raw = err instanceof Error ? err.message : String(err);

  // ── Rate limit (429) ────────────────────────────────────────────────────
  const is429 =
    raw.includes('429') ||
    raw.toLowerCase().includes('rate limit') ||
    raw.toLowerCase().includes('quota') ||
    // Anthropic SDK exposes .status
    (typeof (err as Record<string, unknown>).status === 'number' &&
      (err as Record<string, unknown>).status === 429);

  if (is429) {
    // Extract "retry in Xs" if present
    const retryMatch = raw.match(/retry[^0-9]*(\d+(?:\.\d+)?)\s*s/i);
    const retryHint = retryMatch ? ` Retry in ${Math.ceil(Number(retryMatch[1]))}s.` : '';

    if (provider === 'gemini') {
      const dailyMatch = raw.match(/limit:\s*(\d+)/i);
      const limitHint = dailyMatch ? ` (free tier: ${dailyMatch[1]} req/day)` : '';
      return `Gemini rate limit exceeded${limitHint}.${retryHint} Upgrade at ai.google.dev/gemini-api/docs/rate-limits`;
    }
    if (provider === 'claude') {
      return `Anthropic rate limit exceeded.${retryHint} Check usage at console.anthropic.com`;
    }
    return `Rate limit exceeded.${retryHint}`;
  }

  // ── Auth errors (401 / invalid key) ─────────────────────────────────────
  const is401 =
    raw.includes('401') ||
    raw.toLowerCase().includes('invalid') ||
    raw.toLowerCase().includes('unauthorized') ||
    (typeof (err as Record<string, unknown>).status === 'number' &&
      (err as Record<string, unknown>).status === 401);

  if (is401) {
    return `${provider === 'gemini' ? 'Gemini' : provider === 'claude' ? 'Anthropic' : 'Ollama'} API key is invalid or expired. Check Settings.`;
  }

  // ── Credit / billing errors ──────────────────────────────────────────────
  if (raw.toLowerCase().includes('credit') || raw.toLowerCase().includes('billing')) {
    return `${provider === 'claude' ? 'Anthropic' : 'Gemini'} account needs credits. Add billing at ${provider === 'claude' ? 'console.anthropic.com' : 'ai.google.dev'}.`;
  }

  // ── Model not found ──────────────────────────────────────────────────────
  if (raw.includes('404') || raw.toLowerCase().includes('not found') || raw.toLowerCase().includes('model')) {
    return `Model not found for ${provider}. Check the model name in Settings.`;
  }

  // ── Fallback: trim to first sentence and cap length ──────────────────────
  const firstLine = raw.split('\n')[0].slice(0, 200);
  return firstLine;
}

export async function POST(req: Request) {
  const body: StreamRequestBody = await req.json();
  const { provider, model, apiKey, ollamaHost, systemPrompt, messages, maxTokens } = body;

  try {
    const tokenStream =
      provider === 'claude'
        ? streamClaude({ model, apiKey, systemPrompt, messages, maxTokens })
        : provider === 'gemini'
        ? streamGemini({ model, apiKey, systemPrompt, messages, maxTokens })
        : streamOllama({ model, baseUrl: ollamaHost ?? 'http://localhost:11434', systemPrompt, messages, maxTokens });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of tokenStream) {
            if (typeof chunk === 'string') {
              controller.enqueue(encoder.encode(chunk));
            } else {
              // Usage sentinel
              controller.enqueue(
                encoder.encode(`\n[USAGE:${JSON.stringify(chunk)}]`)
              );
            }
          }
        } catch (err: unknown) {
          const msg = formatProviderError(err, provider);
          controller.enqueue(encoder.encode(`\n[ERROR:${msg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: unknown) {
    const msg = formatProviderError(err, provider);
    return Response.json({ error: msg }, { status: 500 });
  }
}
