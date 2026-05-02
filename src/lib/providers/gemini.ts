import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiStreamArgs {
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

function adaptRole(role: 'user' | 'assistant'): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

export async function* streamGemini(
  args: GeminiStreamArgs
): AsyncGenerator<string | UsageResult> {
  const { model, apiKey, systemPrompt, messages, maxTokens = 1024 } = args;
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: maxTokens },
  });

  // Gemini requires alternating user/model roles; history excludes last message
  const history = messages.slice(0, -1).map((m) => ({
    role: adaptRole(m.role),
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages.at(-1);
  if (!lastMessage) return;

  const chat = geminiModel.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  let inputTokens = 0;
  let outputTokens = 0;

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }

  const response = await result.response;
  if (response.usageMetadata) {
    inputTokens = response.usageMetadata.promptTokenCount ?? 0;
    outputTokens = response.usageMetadata.candidatesTokenCount ?? 0;
  }

  yield { inputTokens, outputTokens };
}
