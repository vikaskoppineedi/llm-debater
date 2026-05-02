'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CredentialsStore {
  claudeApiKey: string;
  claudeModels: string[];
  geminiApiKey: string;
  geminiModels: string[];
  ollamaHost: string;
  ollamaModels: string[];

  setClaudeApiKey: (key: string) => void;
  setClaudeModels: (models: string[]) => void;
  setGeminiApiKey: (key: string) => void;
  setGeminiModels: (models: string[]) => void;
  setOllamaHost: (host: string) => void;
  setOllamaModels: (models: string[]) => void;
}

export const useCredentialsStore = create<CredentialsStore>()(
  persist(
    (set) => ({
      claudeApiKey: '',
      claudeModels: [],
      geminiApiKey: '',
      geminiModels: [],
      ollamaHost: 'http://localhost:11434',
      ollamaModels: [],

      setClaudeApiKey: (key) => set({ claudeApiKey: key, claudeModels: [] }),
      setClaudeModels: (models) => set({ claudeModels: models }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key, geminiModels: [] }),
      setGeminiModels: (models) => set({ geminiModels: models }),
      setOllamaHost: (host) => set({ ollamaHost: host, ollamaModels: [] }),
      setOllamaModels: (models) => set({ ollamaModels: models }),
    }),
    { name: 'llm-debater-credentials' }
  )
);
