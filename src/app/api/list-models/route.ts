import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  const { provider, apiKey, ollamaHost } = await req.json();

  try {
    if (provider === 'claude') {
      const client = new Anthropic({ apiKey });
      const page = await client.models.list({ limit: 100 });
      const models = page.data.map((m) => m.id);
      return Response.json({ models });
    }

    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const models: string[] = (data.models ?? [])
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: { name: string }) => m.name.replace('models/', ''));
      return Response.json({ models });
    }

    if (provider === 'ollama') {
      const host = ollamaHost ?? 'http://localhost:11434';
      const res = await fetch(`${host}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
      const data = await res.json();
      const models: string[] = (data.models ?? []).map(
        (m: { name: string }) => m.name
      );
      return Response.json({ models });
    }

    return Response.json({ models: [], error: 'Unknown provider' });
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Failed to fetch models';
    const message = raw.length > 200 ? raw.slice(0, 200) + '...' : raw;
    return Response.json({ models: [], error: message });
  }
}
