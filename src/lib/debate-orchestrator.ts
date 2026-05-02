'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useDebateStore } from '@/store/debate-store';
import { useHistoryStore } from '@/store/history-store';
import { useCredentialsStore } from '@/store/credentials-store';
import { buildSystemPrompt, buildSummaryPrompt, buildArchitectureSummaryPrompt } from './system-prompts';

const MAX_CONTEXT_MESSAGES = 20;
const OPENING_KEPT = 2;
import { calcCost } from './cost-calculator';
import type { DebateMessage, DebaterConfig } from './types';

const USAGE_RE = /\[USAGE:(\{.*?\})\]/;
const ERROR_RE = /\[ERROR:(.*?)\]/;

interface AutoSaveHistory {
  saveDebate: (d: Omit<import('./types').SavedDebate, 'id' | 'savedAt'>) => Promise<string>;
  upsertDebate: (d: import('./types').SavedDebate) => Promise<void>;
}

/** Fire-and-forget auto-save. Creates a new history record or upserts the existing one. */
function autoSaveDebate(
  snap: ReturnType<typeof useDebateStore.getState>,
  historyStore: AutoSaveHistory,
  setSavedDebateId: (id: string | null) => void,
  status: 'paused' | 'stopped' = 'paused'
) {
  if (!snap.config || snap.transcript.length === 0) return;
  const payload = {
    topic: snap.config.topic,
    debaters: snap.config.debaters,
    transcript: snap.transcript,
    consensusSummary: snap.consensusSummary,
    totalCost: snap.totalCost,
    totalRounds: snap.config.totalRounds,
    completedRounds: Math.max(0, snap.currentRound - 1),
    status,
  };
  if (snap.savedDebateId) {
    historyStore.upsertDebate({ ...payload, id: snap.savedDebateId, savedAt: Date.now() });
  } else {
    historyStore.saveDebate(payload).then((id) => setSavedDebateId(id));
  }
}

/** Merge back-to-back messages with the same role (user/user or assistant/assistant).
 *  Claude and Gemini reject consecutive same-role messages; this collapses them. */
function mergeConsecutiveRoles(
  msgs: Array<{ role: 'user' | 'assistant'; content: string }>
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const msg of msgs) {
    if (out.length > 0 && out[out.length - 1].role === msg.role) {
      out[out.length - 1] = {
        ...out[out.length - 1],
        content: out[out.length - 1].content + '\n\n' + msg.content,
      };
    } else {
      out.push({ ...msg });
    }
  }
  return out;
}

function buildMessages(
  transcript: DebateMessage[],
  currentDebaterId: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const toApiMsg = (m: DebateMessage) => ({
    role: (m.debaterId === currentDebaterId ? 'assistant' : 'user') as 'user' | 'assistant',
    content:
      m.role === 'client'
        ? `[CLIENT INPUT — acknowledge this and weave it into your response, but continue engaging with the other debaters]: ${m.text}`
        : m.text,
  });

  const filtered = transcript.filter((m) => {
    // Never include empty messages — they are failed turns that got cleaned up
    if (!m.text.trim() && !m.isStreaming) return false;
    if (m.role === 'client') {
      return m.targetDebaterId === 'all' || m.targetDebaterId === currentDebaterId;
    }
    return true;
  });

  // Apply rolling window: keep opening arguments + recent messages
  if (filtered.length <= MAX_CONTEXT_MESSAGES) {
    return mergeConsecutiveRoles(filtered.map(toApiMsg));
  }

  const opening = filtered.slice(0, OPENING_KEPT);
  const recentCount = MAX_CONTEXT_MESSAGES - OPENING_KEPT - 1; // -1 for the separator
  const recent = filtered.slice(-recentCount);
  return mergeConsecutiveRoles([
    ...opening.map(toApiMsg),
    {
      role: 'user' as const,
      content: '[Earlier rounds condensed — focus on the recent exchanges below and the agreed direction.]',
    },
    ...recent.map(toApiMsg),
  ]);
}

function transcriptToText(transcript: DebateMessage[]): string {
  return transcript
    .filter((m) => m.role !== 'client')
    .map((m) => `[${m.role.toUpperCase()}] ${m.debaterName}: ${m.text}`)
    .join('\n\n');
}

export function useDebateOrchestrator() {
  const store = useDebateStore();
  const historyStore = useHistoryStore();
  const credentials = useCredentialsStore();
  const abortRef = useRef<AbortController | null>(null);
  const isRunningRef = useRef(false);

  const generateSummary = useCallback(async () => {
    const { config, transcript, totalCost, currentRound, status } = useDebateStore.getState();
    if (!config) return;

    const isConcluding = status === 'concluding';

    // Use the first debater with a non-empty API key (or first debater for Ollama)
    const summarizer =
      config.debaters.find((d) => d.provider !== 'ollama') ??
      config.debaters[0];

    const transcriptText = transcriptToText(transcript);

    // For a concluding summary, extract just the Pro debater's final turn to refine
    // rather than re-summarizing the full debate (which could hit context limits)
    const lastProTurn = isConcluding
      ? [...transcript].reverse().find((m) => m.role === 'pro')?.text ?? transcriptText
      : transcriptText;

    const systemPrompt = isConcluding
      ? buildArchitectureSummaryPrompt(config.topic, lastProTurn)
      : buildSummaryPrompt(config.topic, transcriptText);

    const maxTokens = isConcluding ? 4000 : 512;

    const summarizerApiKey =
      summarizer.provider === 'claude'
        ? credentials.claudeApiKey
        : summarizer.provider === 'gemini'
        ? credentials.geminiApiKey
        : '';

    try {
      const res = await fetch('/api/debate/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: summarizer.provider,
          model: summarizer.model,
          apiKey: summarizerApiKey,
          ollamaHost: credentials.ollamaHost,
          systemPrompt,
          topic: config.topic,
          transcript: isConcluding ? lastProTurn : transcriptText,
          maxTokens,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        store.setConsensusSummary(data.summary);
      }
    } catch {
      store.setConsensusSummary(
        'Consensus reached — see the final round for the agreed conclusion.'
      );
    }

    // Auto-save: update the existing entry if this is a continued debate,
    // otherwise create a new one.
    const { savedDebateId } = useDebateStore.getState();
    if (savedDebateId) {
      await historyStore.upsertDebate({
        id: savedDebateId,
        savedAt: Date.now(),
        topic: config.topic,
        debaters: config.debaters,
        transcript,
        consensusSummary: useDebateStore.getState().consensusSummary,
        totalCost,
        totalRounds: config.totalRounds,
        completedRounds: currentRound - 1,
        status: 'completed',
      });
      store.setSavedDebateId(null);
    } else {
      await historyStore.saveDebate({
        topic: config.topic,
        debaters: config.debaters,
        transcript,
        consensusSummary: store.consensusSummary,
        totalCost,
        totalRounds: config.totalRounds,
        completedRounds: currentRound - 1,
        status: 'completed',
      });
    }

    store.setStatus('completed');
  }, [store, historyStore]);

  const runNextTurn = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const { config, transcript, getCurrentDebater, isDebateComplete } = store;

    if (!config) {
      isRunningRef.current = false;
      return;
    }

    if (isDebateComplete()) {
      isRunningRef.current = false;
      await generateSummary();
      return;
    }

    const debater = getCurrentDebater();
    if (!debater) {
      isRunningRef.current = false;
      return;
    }

    const isFinalTurn =
      store.currentRound >= config.totalRounds || store.status === 'concluding';
    const systemPrompt = buildSystemPrompt(
      debater,
      config.topic,
      store.currentRound,
      config.totalRounds
    );
    const messages = buildMessages(transcript, debater.id);
    const maxTokens = 8192;

    // Need at least one user message for the first debater
    if (messages.length === 0 || messages[messages.length - 1].role === 'assistant') {
      messages.push({
        role: 'user',
        content: `The debate topic is: "${config.topic}". Please present your opening argument.`,
      });
    }

    const messageId = store.appendMessage({
      debaterId: debater.id,
      role: debater.side,
      debaterName: debater.name,
      round: store.currentRound,
      text: '',
      isStreaming: true,
    });

    const apiKey =
      debater.provider === 'claude'
        ? credentials.claudeApiKey
        : debater.provider === 'gemini'
        ? credentials.geminiApiKey
        : '';

    abortRef.current = new AbortController();
    let accumulatedText = '';

    try {
      const res = await fetch('/api/debate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: debater.provider,
          model: debater.model,
          apiKey,
          ollamaHost: credentials.ollamaHost,
          systemPrompt,
          messages,
          maxTokens,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Check for USAGE sentinel
        const usageMatch = buffer.match(USAGE_RE);
        if (usageMatch) {
          try {
            const usage = JSON.parse(usageMatch[1]);
            const cost = calcCost(debater.model, usage.inputTokens, usage.outputTokens);
            store.addTurnCost({
              debaterId: debater.id,
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              cost,
            });
          } catch { /* ignore parse errors */ }
          buffer = buffer.replace(USAGE_RE, '');
        }

        // Check for ERROR sentinel — halt the debate immediately
        const errMatch = buffer.match(ERROR_RE);
        if (errMatch) {
          store.setError(`${debater.name} failed to respond: ${errMatch[1]}`);
          store.setStatus('paused');
          buffer = buffer.replace(ERROR_RE, '');
        }

        // Flush clean text tokens up to (but not including) a known sentinel prefix.
        // Use specific prefixes so normal LLM text like "\n[1] ..." is not held back.
        const usageSentinelIdx = buffer.indexOf('\n[USAGE:');
        const errorSentinelIdx = buffer.indexOf('\n[ERROR:');
        const sentinelCandidates = [usageSentinelIdx, errorSentinelIdx].filter((i) => i >= 0);
        const sentinelIdx = sentinelCandidates.length > 0 ? Math.min(...sentinelCandidates) : -1;
        const safeText = sentinelIdx >= 0 ? buffer.slice(0, sentinelIdx) : buffer;
        if (safeText) {
          accumulatedText += safeText;
          store.appendToken(messageId, safeText);
          buffer = buffer.slice(safeText.length);
        }
      }

      // If the debater produced nothing (error before any tokens), remove the
      // empty message entirely so it never poisons other debaters' context.
      if (accumulatedText.trim()) {
        store.finalizeMessage(messageId);
      } else {
        store.deleteMessage(messageId);
      }

      // An error was signalled mid-stream — stop here, don't advance.
      const liveStatus = useDebateStore.getState().status;
      if (liveStatus === 'paused' || liveStatus === 'stopped') {
        isRunningRef.current = false;
        return;
      }

      // In concluding mode the Pro debater has just delivered the final architecture —
      // go straight to summary without running any other debaters
      if (liveStatus === 'concluding') {
        isRunningRef.current = false;
        await generateSummary();
        return;
      }

      // Check before advancing whether this was the last debater in the round
      const isLastDebaterInRound =
        useDebateStore.getState().currentDebaterIndex === config.debaters.length - 1;

      store.advanceTurn();

      // Auto-pause at the end of each full round so the user can read and optionally comment
      if (isLastDebaterInRound && useDebateStore.getState().status === 'running') {
        isRunningRef.current = false;
        store.setStatus('paused');
        // Auto-save to history DB at the end of every round
        autoSaveDebate(useDebateStore.getState(), historyStore, store.setSavedDebateId);
        return;
      }

      // Otherwise continue to the next turn within the same round
      if (useDebateStore.getState().status === 'running') {
        isRunningRef.current = false;
        setTimeout(() => {
          if (useDebateStore.getState().status === 'running') runNextTurn();
        }, 300);
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Intentional abort (pause/interrupt/stop) — keep whatever was streamed
        if (accumulatedText.trim()) {
          store.finalizeMessage(messageId);
        } else {
          store.deleteMessage(messageId);
        }
      } else {
        // Unexpected error (network, auth, rate-limit, etc.) — remove the empty
        // placeholder so it can't be mistaken for a real response by other debaters
        if (accumulatedText.trim()) {
          store.finalizeMessage(messageId);
        } else {
          store.deleteMessage(messageId);
        }
        const msg = err instanceof Error ? err.message : 'Unknown error';
        store.setError(`${debater.name} failed to respond: ${msg}`);
        store.setStatus('paused');
      }
    }

    isRunningRef.current = false;
  }, [store, historyStore, generateSummary]);

  // Watch status and kick off turns
  useEffect(() => {
    const { status } = store;
    if ((status === 'running' || status === 'concluding') && !isRunningRef.current) {
      runNextTurn();
    }
  }, [store.status, runNextTurn]);

  const start = useCallback(() => {
    store.setStatus('running');
  }, [store]);

  const pause = useCallback(() => {
    store.setStatus('paused');
  }, [store]);

  const resume = useCallback(() => {
    store.setStatus('running');
  }, [store]);

  const interrupt = useCallback(() => {
    abortRef.current?.abort();
    store.setStatus('interrupted');
  }, [store]);

  const submitClientInput = useCallback(
    (text: string, targetDebaterId: string | 'all') => {
      store.appendClientMessage(text, targetDebaterId);
      store.setStatus('running');
    },
    [store]
  );

  const reachConclusion = useCallback(() => {
    const { config } = store;
    if (!config) return;
    abortRef.current?.abort();
    isRunningRef.current = false;
    // Jump to the first Pro debater so only they deliver the final architecture
    const proIndex = config.debaters.findIndex((d) => d.side === 'pro');
    store.jumpToFinalRound(proIndex >= 0 ? proIndex : 0);
    store.setStatus('concluding');
  }, [store]);

  const extendRounds = useCallback((extra: number) => {
    store.extendRounds(extra);
    // Re-start the debate if it was completed or paused
    if (store.status === 'completed' || store.status === 'paused' || store.status === 'stopped') {
      store.setStatus('running');
    }
  }, [store]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    store.setStatus('stopped');
    autoSaveDebate(useDebateStore.getState(), historyStore, store.setSavedDebateId, 'stopped');
  }, [store, historyStore]);

  const newDebate = useCallback(() => {
    abortRef.current?.abort();
    // Auto-save before clearing state so the debate isn't lost
    autoSaveDebate(useDebateStore.getState(), historyStore, store.setSavedDebateId, 'stopped');
    store.resetDebate();
  }, [store, historyStore]);

  const saveCurrentDebate = useCallback(async () => {
    const { config, transcript, totalCost, currentRound, consensusSummary, status, savedDebateId } = useDebateStore.getState();
    if (!config || transcript.length === 0) return;
    const savedStatus = status === 'completed' ? 'completed' : 'stopped';
    if (savedDebateId) {
      await historyStore.upsertDebate({
        id: savedDebateId,
        savedAt: Date.now(),
        topic: config.topic,
        debaters: config.debaters,
        transcript,
        consensusSummary: consensusSummary ?? null,
        totalCost,
        totalRounds: config.totalRounds,
        completedRounds: Math.max(0, currentRound - 1),
        status: savedStatus,
      });
    } else {
      await historyStore.saveDebate({
        topic: config.topic,
        debaters: config.debaters,
        transcript,
        consensusSummary: consensusSummary ?? null,
        totalCost,
        totalRounds: config.totalRounds,
        completedRounds: Math.max(0, currentRound - 1),
        status: savedStatus,
      });
    }
  }, [store, historyStore]);

  const deleteMessage = useCallback((messageId: string) => {
    store.deleteMessage(messageId);
  }, [store]);

  return { start, pause, resume, interrupt, submitClientInput, reachConclusion, extendRounds, stop, newDebate, saveCurrentDebate, deleteMessage };
}
