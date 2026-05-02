'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  DebateConfig,
  DebateMessage,
  DebateStatus,
  DebatePhase,
  DebaterConfig,
  TurnCost,
  SavedDebate,
} from '@/lib/types';

interface DebateState {
  config: DebateConfig | null;
  status: DebateStatus;
  currentRound: number;
  currentDebaterIndex: number;
  transcript: DebateMessage[];
  activeMessageId: string | null;
  turnCosts: TurnCost[];
  totalCost: number;
  error: string | null;
  consensusSummary: string | null;
  /** ID of the saved debate being continued — null for fresh debates */
  savedDebateId: string | null;
}

interface DebateStore extends DebateState {
  setConfig: (config: DebateConfig) => void;
  resetDebate: () => void;
  setStatus: (status: DebateStatus) => void;
  advanceTurn: () => void;
  appendMessage: (msg: Omit<DebateMessage, 'id' | 'timestamp'>) => string;
  appendClientMessage: (text: string, targetDebaterId: string | 'all') => void;
  appendToken: (messageId: string, token: string) => void;
  finalizeMessage: (messageId: string) => void;
  setActiveMessageId: (id: string | null) => void;
  addTurnCost: (cost: TurnCost) => void;
  setConsensusSummary: (text: string) => void;
  setError: (error: string | null) => void;
  getCurrentDebater: () => DebaterConfig | null;
  getCurrentPhase: () => DebatePhase;
  isDebateComplete: () => boolean;
  jumpToFinalRound: (debaterIndex?: number) => void;
  extendRounds: (extra: number) => void;
  loadSavedDebate: (debate: SavedDebate) => void;
  deleteMessage: (messageId: string) => void;
  setSavedDebateId: (id: string | null) => void;
}

const initialState: DebateState = {
  config: null,
  status: 'idle',
  currentRound: 1,
  currentDebaterIndex: 0,
  transcript: [],
  activeMessageId: null,
  turnCosts: [],
  totalCost: 0,
  error: null,
  consensusSummary: null,
  savedDebateId: null,
};

export const useDebateStore = create<DebateStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setConfig: (config) =>
        set({
          ...initialState,
          config,
          status: 'idle',
        }),

      resetDebate: () => set(initialState),

      setStatus: (status) => set({ status }),

      advanceTurn: () => {
        const { config, currentRound, currentDebaterIndex } = get();
        if (!config) return;
        const nextIndex = currentDebaterIndex + 1;
        if (nextIndex >= config.debaters.length) {
          set({ currentDebaterIndex: 0, currentRound: currentRound + 1 });
        } else {
          set({ currentDebaterIndex: nextIndex });
        }
      },

      appendMessage: (msg) => {
        const id = nanoid();
        set((s) => ({
          transcript: [...s.transcript, { ...msg, id, timestamp: Date.now() }],
          activeMessageId: id,
        }));
        return id;
      },

      appendClientMessage: (text, targetDebaterId) => {
        const id = nanoid();
        set((s) => ({
          transcript: [
            ...s.transcript,
            {
              id,
              debaterId: 'client',
              role: 'client' as const,
              debaterName: 'You',
              round: 0,
              text,
              isStreaming: false,
              timestamp: Date.now(),
              targetDebaterId,
            },
          ],
        }));
      },

      appendToken: (messageId, token) => {
        set((s) => ({
          transcript: s.transcript.map((m) =>
            m.id === messageId ? { ...m, text: m.text + token } : m
          ),
        }));
      },

      finalizeMessage: (messageId) => {
        set((s) => ({
          transcript: s.transcript.map((m) =>
            m.id === messageId ? { ...m, isStreaming: false } : m
          ),
          activeMessageId: null,
        }));
      },

      setActiveMessageId: (id) => set({ activeMessageId: id }),

      addTurnCost: (cost) => {
        set((s) => ({
          turnCosts: [...s.turnCosts, cost],
          totalCost: s.totalCost + cost.cost,
        }));
      },

      setConsensusSummary: (text) => set({ consensusSummary: text }),

      setError: (error) => set({ error }),

      getCurrentDebater: () => {
        const { config, currentDebaterIndex } = get();
        return config?.debaters[currentDebaterIndex] ?? null;
      },

      getCurrentPhase: (): DebatePhase => {
        const { config, currentRound } = get();
        if (!config) return 'argumentation';
        const total = config.totalRounds;
        if (currentRound >= total) return 'final';
        if (currentRound > Math.floor(total * 0.5)) return 'convergence';
        return 'argumentation';
      },

      isDebateComplete: () => {
        const { config, currentRound } = get();
        if (!config) return false;
        return currentRound > config.totalRounds;
      },

      jumpToFinalRound: (debaterIndex = 0) => {
        const { config } = get();
        if (!config) return;
        set({ currentRound: config.totalRounds, currentDebaterIndex: debaterIndex });
      },

      extendRounds: (extra) => {
        const { config } = get();
        if (!config) return;
        set({ config: { ...config, totalRounds: config.totalRounds + extra } });
      },

      loadSavedDebate: (debate) => {
        set({
          config: {
            topic: debate.topic,
            totalRounds: debate.totalRounds,
            debaters: debate.debaters,
          },
          status: 'paused',
          currentRound: Math.min(debate.completedRounds + 1, debate.totalRounds),
          currentDebaterIndex: 0,
          transcript: debate.transcript,
          activeMessageId: null,
          turnCosts: [],
          totalCost: debate.totalCost,
          error: null,
          consensusSummary: debate.consensusSummary,
          savedDebateId: debate.id,
        });
      },

      deleteMessage: (messageId) => {
        set((s) => ({
          transcript: s.transcript.filter((m) => m.id !== messageId),
        }));
      },

      setSavedDebateId: (id) => set({ savedDebateId: id }),
    }),
    {
      name: 'llm-debater-active',
      partialize: (s) => ({
        config: s.config,
        status: s.status,
        currentRound: s.currentRound,
        currentDebaterIndex: s.currentDebaterIndex,
        transcript: s.transcript,
        turnCosts: s.turnCosts,
        totalCost: s.totalCost,
        consensusSummary: s.consensusSummary,
        savedDebateId: s.savedDebateId,
      }),
      onRehydrateStorage: () => (state) => {
        // If the page reloads mid-debate, restore as paused so the user can manually resume
        if (state && (state.status === 'running' || state.status === 'concluding')) {
          state.status = 'paused';
        }
      },
    }
  )
);
