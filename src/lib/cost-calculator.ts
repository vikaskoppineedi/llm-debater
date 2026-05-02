// Pricing per 1M tokens [input, output] in USD
const PRICING: Record<string, [number, number]> = {
  'claude-opus-4-6': [15.0, 75.0],
  'claude-sonnet-4-6': [3.0, 15.0],
  'claude-haiku-4-5-20251001': [0.8, 4.0],
  'gemini-2.0-flash': [0.075, 0.3],
  'gemini-2.0-flash-exp': [0.0, 0.0],
  'gemini-1.5-pro': [1.25, 5.0],
  'gemini-1.5-flash': [0.075, 0.3],
};

export function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const [inRate, outRate] = PRICING[model] ?? [0, 0];
  return (inputTokens / 1_000_000) * inRate + (outputTokens / 1_000_000) * outRate;
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(4)}`;
}
