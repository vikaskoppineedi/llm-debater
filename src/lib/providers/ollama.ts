interface OllamaStreamArgs {
  model: string;
  baseUrl: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}

interface UsageResult {
  inputTokens: number;
  outputTokens: number;
}

export async function* streamOllama(
  args: OllamaStreamArgs
): AsyncGenerator<string | UsageResult> {
  const { model, baseUrl, systemPrompt, messages, maxTokens = 1024 } = args;

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: true,
      options: { num_predict: maxTokens },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let promptTokens = 0;
  let evalTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          yield json.message.content as string;
        }
        if (json.done && json.prompt_eval_count) {
          promptTokens = json.prompt_eval_count;
          evalTokens = json.eval_count ?? 0;
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  yield { inputTokens: promptTokens, outputTokens: evalTokens };
}
