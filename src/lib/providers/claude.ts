import Anthropic from '@anthropic-ai/sdk';

interface ClaudeStreamArgs {
  model: string;
  apiKey: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}

interface UsageResult {
  inputTokens: number;
  outputTokens: number;
}

export async function* streamClaude(
  args: ClaudeStreamArgs
): AsyncGenerator<string | UsageResult> {
  const { model, apiKey, systemPrompt, messages, maxTokens = 1024 } = args;
  const client = new Anthropic({ apiKey });

  const stream = client.messages.stream({
    model,
    system: systemPrompt,
    messages,
    max_tokens: maxTokens,
  });

  let inputTokens = 0;
  let outputTokens = 0;

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
    if (event.type === 'message_delta' && event.usage) {
      outputTokens = event.usage.output_tokens;
    }
    if (event.type === 'message_start' && event.message.usage) {
      inputTokens = event.message.usage.input_tokens;
    }
  }

  yield { inputTokens, outputTokens };
}
