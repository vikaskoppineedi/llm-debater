import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TestProviderRequestBody } from '@/lib/types';

export async function POST(req: Request) {
  const { provider, model, apiKey, ollamaHost }: TestProviderRequestBody = await req.json();

  try {
    if (provider === 'claude') {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }],
      });
    } else if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ model });
      await geminiModel.generateContent('Hi');
    } else {
      // Ollama — check server reachability
      const res = await fetch(`${ollamaHost ?? 'http://localhost:11434'}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('Ollama server returned an error');
    }

    return Response.json({ ok: true, message: 'Connected successfully' });
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Connection failed';
    // Trim verbose SDK error messages
    const message = raw.length > 120 ? raw.slice(0, 120) + '...' : raw;
    return Response.json({ ok: false, message });
  }
}
