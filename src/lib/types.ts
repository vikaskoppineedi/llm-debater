export type ProviderName = 'claude' | 'gemini' | 'ollama';
export type DebaterSide = 'pro' | 'con' | 'neutral';
export type DebatePhase = 'argumentation' | 'convergence' | 'final';
export type DebateStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'interrupted'
  | 'concluding'
  | 'stopped'
  | 'completed';

export type MessageRole = 'pro' | 'con' | 'neutral' | 'client';

export interface DebaterConfig {
  id: string;
  name: string;
  provider: ProviderName;
  model: string;
  side: DebaterSide;
  role: string; // editable expert persona / system prompt prefix
}

export interface DebateConfig {
  topic: string;
  totalRounds: number;
  debaters: DebaterConfig[];
}

export interface DebateMessage {
  id: string;
  debaterId: string | 'client';
  role: MessageRole;
  debaterName: string;
  round: number;
  text: string;
  isStreaming: boolean;
  timestamp: number;
  targetDebaterId?: string | 'all'; // only for client messages
}

export interface TurnCost {
  debaterId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface StreamRequestBody {
  provider: ProviderName;
  model: string;
  apiKey: string;
  ollamaHost: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}

export interface TestProviderRequestBody {
  provider: ProviderName;
  model: string;
  apiKey: string;
  ollamaHost?: string;
}

export interface TestProviderResponse {
  ok: boolean;
  message: string;
}

export interface PromptTemplate {
  id: string;
  name: string;          // "Expert Fitness Trainer"
  description: string;   // Short summary shown in the library card
  role: string;          // The actual system prompt injected into the debater
  category: string;      // "Fitness", "Health", "Technology", "Business", "AI", "General"
  createdAt: number;
  isBuiltIn?: boolean;   // true for seed prompts — cannot be deleted
}

export interface SavedDebate {
  id: string;
  topic: string;
  savedAt: number;
  debaters: DebaterConfig[];
  transcript: DebateMessage[];
  consensusSummary: string | null;
  totalCost: number;
  totalRounds: number;
  completedRounds: number;
  status: 'completed' | 'stopped' | 'paused';
}
