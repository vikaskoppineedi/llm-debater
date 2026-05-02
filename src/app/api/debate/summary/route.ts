import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProviderName } from '@/lib/types';

interface SummaryRequestBody {
  provider: ProviderName;
  model: string;
  apiKey: string;
  ollamaHost?: string;
  systemPrompt: string;
  topic: string;
  transcript: string;
  maxTokens?: number;
}

export async function POST(req: Request) {
  const body: SummaryRequestBody = await req.json();
  const { provider, model, apiKey, ollamaHost, systemPrompt, transcript, maxTokens = 512 } = body;

  try {
    let summary = '';

    if (provider === 'claude') {
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model,
        system: systemPrompt,
        messages: [{ role: 'user', content: transcript }],
        max_tokens: maxTokens,
      });
      summary =
        response.content[0].type === 'text' ? response.content[0].text : '';
    } else if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: maxTokens },
      });
      const result = await geminiModel.generateContent(transcript);
      summary = result.response.text();
    } else {
      // Ollama
      const res = await fetch(`${ollamaHost ?? 'http://localhost:11434'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript },
          ],
        }),
      });
      const data = await res.json();
      summary = data.message?.content ?? '';
    }

    return Response.json({ summary });
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : String(err);
    // Surface a clean message instead of the raw SDK blob
    const is429 = raw.includes('429') || raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('rate limit');
    const msg = is429
      ? `${provider} rate limit hit during summary generation. The debate transcript has been saved — try "Reach Conclusion" again in a minute.`
      : raw.split('\n')[0].slice(0, 200);
    return Response.json({ error: msg }, { status: 500 });
  }
}
