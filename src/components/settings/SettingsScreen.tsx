'use client';

import { useState } from 'react';
import { useCredentialsStore } from '@/store/credentials-store';
import type { ProviderName } from '@/lib/types';

interface SettingsScreenProps {
  onBack: () => void;
}

type ConnectState = 'idle' | 'loading' | 'ok' | 'error';

interface ProviderSectionProps {
  title: string;
  keyLabel: string;
  keyPlaceholder: string;
  apiKey: string;
  models: string[];
  connectState: ConnectState;
  connectError: string;
  onKeyChange: (key: string) => void;
  onConnect: () => void;
  // Ollama-only
  hostValue?: string;
  onHostChange?: (host: string) => void;
}

function ProviderSection({
  title,
  keyLabel,
  keyPlaceholder,
  apiKey,
  models,
  connectState,
  connectError,
  onKeyChange,
  onConnect,
  hostValue,
  onHostChange,
}: ProviderSectionProps) {
  const isOllama = hostValue !== undefined;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>

      {isOllama ? (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Host URL</label>
          <input
            value={hostValue}
            onChange={(e) => onHostChange?.(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs text-gray-500 mb-1">{keyLabel}</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder={keyPlaceholder}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      )}

      <button
        onClick={onConnect}
        disabled={connectState === 'loading' || (!isOllama && !apiKey.trim())}
        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium"
      >
        {connectState === 'loading' ? 'Connecting...' : 'Connect'}
      </button>

      {connectState === 'error' && (
        <p className="text-xs text-red-400">✗ {connectError}</p>
      )}

      {connectState === 'ok' && models.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-green-400 font-medium">
            ✓ Connected — {models.length} model{models.length !== 1 ? 's' : ''} available
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {models.map((m) => (
              <div
                key={m}
                className="bg-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 font-mono"
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      )}

      {connectState === 'ok' && models.length === 0 && (
        <p className="text-xs text-amber-500">Connected but no models found.</p>
      )}
    </div>
  );
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const creds = useCredentialsStore();

  const [claudeKey, setClaudeKey] = useState(creds.claudeApiKey);
  const [geminiKey, setGeminiKey] = useState(creds.geminiApiKey);
  const [ollamaHost, setOllamaHost] = useState(creds.ollamaHost);

  const [claudeState, setClaudeState] = useState<ConnectState>(
    creds.claudeModels.length > 0 ? 'ok' : 'idle'
  );
  const [claudeError, setClaudeError] = useState('');

  const [geminiState, setGeminiState] = useState<ConnectState>(
    creds.geminiModels.length > 0 ? 'ok' : 'idle'
  );
  const [geminiError, setGeminiError] = useState('');

  const [ollamaState, setOllamaState] = useState<ConnectState>(
    creds.ollamaModels.length > 0 ? 'ok' : 'idle'
  );
  const [ollamaError, setOllamaError] = useState('');

  const connect = async (provider: ProviderName) => {
    const setState =
      provider === 'claude' ? setClaudeState :
      provider === 'gemini' ? setGeminiState : setOllamaState;
    const setError =
      provider === 'claude' ? setClaudeError :
      provider === 'gemini' ? setGeminiError : setOllamaError;

    setState('loading');
    setError('');

    // Save key/host before connecting
    if (provider === 'claude') creds.setClaudeApiKey(claudeKey);
    if (provider === 'gemini') creds.setGeminiApiKey(geminiKey);
    if (provider === 'ollama') creds.setOllamaHost(ollamaHost);

    try {
      const res = await fetch('/api/list-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: provider === 'claude' ? claudeKey : geminiKey,
          ollamaHost: provider === 'ollama' ? ollamaHost : undefined,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setState('error');
        setError(data.error);
        return;
      }

      if (provider === 'claude') creds.setClaudeModels(data.models);
      if (provider === 'gemini') creds.setGeminiModels(data.models);
      if (provider === 'ollama') creds.setOllamaModels(data.models);

      setState('ok');
    } catch (err: unknown) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-6">
        <p className="text-sm text-gray-500">
          Configure your AI providers once here. API keys are saved locally in your browser and never stored on any server.
        </p>

        <ProviderSection
          title="Claude (Anthropic)"
          keyLabel="API Key"
          keyPlaceholder="sk-ant-..."
          apiKey={claudeKey}
          models={creds.claudeModels}
          connectState={claudeState}
          connectError={claudeError}
          onKeyChange={(k) => { setClaudeKey(k); setClaudeState('idle'); }}
          onConnect={() => connect('claude')}
        />

        <ProviderSection
          title="Gemini (Google)"
          keyLabel="API Key"
          keyPlaceholder="AIza..."
          apiKey={geminiKey}
          models={creds.geminiModels}
          connectState={geminiState}
          connectError={geminiError}
          onKeyChange={(k) => { setGeminiKey(k); setGeminiState('idle'); }}
          onConnect={() => connect('gemini')}
        />

        <ProviderSection
          title="Ollama (Local)"
          keyLabel=""
          keyPlaceholder=""
          apiKey=""
          models={creds.ollamaModels}
          connectState={ollamaState}
          connectError={ollamaError}
          onKeyChange={() => {}}
          onConnect={() => connect('ollama')}
          hostValue={ollamaHost}
          onHostChange={(h) => { setOllamaHost(h); setOllamaState('idle'); }}
        />
      </main>
    </div>
  );
}
