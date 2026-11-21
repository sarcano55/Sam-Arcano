import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { SimulatorPromptResult, SimulatorProvider } from '../types/geo';
import {
  buildSuggestedPrompts,
  clearAllSessionApiKeys,
  getSessionApiKey,
  runByokPrompt,
  setSessionApiKey,
} from '../utils/byokClient';
import { splitTextByBrand } from '../utils/sanitizer';

interface SimulatorTabProps {
  brandName: string;
  targetTopic: string;
}

const COOLDOWN_SECONDS = 5;
const MAX_PROMPTS_PER_BATCH = 3;

export function SimulatorTab({ brandName, targetTopic }: SimulatorTabProps) {
  const [provider, setProvider] = useState<SimulatorProvider>('openai');
  const [apiKey, setApiKey] = useState<string>(() => getSessionApiKey('openai'));
  const [showKey, setShowKey] = useState(false);
  const [prompts, setPrompts] = useState<[string, string, string]>(() =>
    buildSuggestedPrompts(targetTopic)
  );
  const [promptsEditedManually, setPromptsEditedManually] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [results, setResults] = useState<SimulatorPromptResult[]>([]);
  const [keyClearedBanner, setKeyClearedBanner] = useState(false);

  // Keep prompts synced with Target Topic unless user edited them manually
  useEffect(() => {
    if (!promptsEditedManually) {
      setPrompts(buildSuggestedPrompts(targetTopic));
    }
  }, [targetTopic, promptsEditedManually]);

  // Countdown 5-second client-side cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleProviderChange = (nextProvider: SimulatorProvider) => {
    setProvider(nextProvider);
    setApiKey(getSessionApiKey(nextProvider));
    setKeyClearedBanner(false);
  };

  const handleKeyChange = (nextKey: string) => {
    setApiKey(nextKey);
    setSessionApiKey(provider, nextKey);
    setKeyClearedBanner(false);
  };

  const handleClearKeyNow = () => {
    clearAllSessionApiKeys();
    setApiKey('');
    setShowKey(false);
    setKeyClearedBanner(true);
  };

  const handlePromptChange = (index: 0 | 1 | 2, value: string) => {
    setPromptsEditedManually(true);
    setPrompts((prev) => {
      const next: [string, string, string] = [...prev] as [string, string, string];
      next[index] = value;
      return next;
    });
  };

  const handleResetSuggestedPrompts = () => {
    setPromptsEditedManually(false);
    setPrompts(buildSuggestedPrompts(targetTopic));
  };

  const activePrompts = prompts
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, MAX_PROMPTS_PER_BATCH);

  const handleRunSimulation = async () => {
    if (!apiKey.trim() || activePrompts.length === 0 || isRunning || cooldownRemaining > 0) {
      return;
    }

    setIsRunning(true);
    setResults([]);

    try {
      const batchResults: SimulatorPromptResult[] = [];
      for (const promptText of activePrompts) {
        const res = await runByokPrompt({
          provider,
          apiKey,
          prompt: promptText,
          brandName,
        });
        batchResults.push(res);
      }
      setResults(batchResults);
    } finally {
      setIsRunning(false);
      setCooldownRemaining(COOLDOWN_SECONDS);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Optional Direct-Browser Disclosure & $5 Cap Notice */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-300">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
          <div>
            <p className="font-semibold text-slate-100">
              100% Optional Client-Side Citation Simulator
            </p>
            <p className="mt-1 text-slate-400">
              Calls go directly from your browser to{' '}
              <span className="font-mono text-slate-200">OpenAI (gpt-4o-mini)</span> or{' '}
              <span className="font-mono text-slate-200">Perplexity (sonar)</span>. Keys are stored{' '}
              <span className="font-semibold text-emerald-400">only in sessionStorage</span> and wipe automatically when you close this tab.
            </p>
            <p className="mt-1.5 text-rose-300">
              Recommendation: Set a <span className="font-semibold">$5 spending cap</span> on any temporary BYOK API key before testing.
            </p>
          </div>
        </div>
      </div>

      {/* Provider + Ephemeral API Key Controls */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-4">
            <label
              htmlFor="byok-provider-select"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Model Provider
            </label>
            <select
              id="byok-provider-select"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as SimulatorProvider)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="openai">OpenAI (gpt-4o-mini)</option>
              <option value="perplexity">Perplexity (sonar)</option>
            </select>
          </div>

          <div className="sm:col-span-5">
            <label
              htmlFor="byok-api-key-input"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300"
            >
              <KeyRound className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <span>Temporary API Key (sessionStorage)</span>
            </label>
            <div className="relative">
              <input
                id="byok-api-key-input"
                type={showKey ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : 'pplx-...'}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-3.5 pr-10 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={handleClearKeyNow}
              className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Key Now</span>
            </button>
          </div>
        </div>

        {keyClearedBanner && (
          <p className="mt-3 text-xs font-medium text-emerald-400">
            All session API keys wiped from browser sessionStorage.
          </p>
        )}
      </section>

      {/* Up to 3 Buyer-Intent Test Prompts */}
      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Buyer-Intent Test Prompts (Max 3 per Batch)
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Test whether{' '}
              <span className="font-semibold text-cyan-300">
                {brandName.trim() || 'your brand'}
              </span>{' '}
              is recalled organically for high-intent queries.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetSuggestedPrompts}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Auto-Suggest from Topic</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {prompts.map((promptVal, idx) => (
            <div key={`sim-prompt-${idx}`}>
              <label
                htmlFor={`sim-prompt-input-${idx}`}
                className="mb-1 block font-mono text-[11px] font-medium text-slate-400"
              >
                Prompt {idx + 1}
              </label>
              <input
                id={`sim-prompt-input-${idx}`}
                type="text"
                maxLength={300}
                value={promptVal}
                onChange={(e) => handlePromptChange(idx as 0 | 1 | 2, e.target.value)}
                placeholder={`Buyer-intent query #${idx + 1}...`}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            {activePrompts.length} / {MAX_PROMPTS_PER_BATCH} prompts queued · 5s batch cooldown enforced
          </span>

          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={
              !apiKey.trim() ||
              activePrompts.length === 0 ||
              isRunning ||
              cooldownRemaining > 0
            }
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 whitespace-nowrap cursor-pointer"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Running Batch...</span>
              </>
            ) : cooldownRemaining > 0 ? (
              <span className="font-mono tabular-nums">
                Cooldown: {cooldownRemaining}s
              </span>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>Run Citation Simulation</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Simulation Responses */}
      {results.length > 0 && (
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-100">
            Simulation Output ({provider === 'openai' ? 'OpenAI gpt-4o-mini' : 'Perplexity sonar'})
          </h3>

          {results.map((res, idx) => {
            const segments = splitTextByBrand(res.responseText, brandName);
            return (
              <article
                key={`sim-res-${idx}`}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <p className="text-xs font-semibold text-slate-200">
                    Prompt {idx + 1}: {res.prompt}
                  </p>

                  {!res.error && (
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums whitespace-nowrap ${
                        res.brandMentionCount > 0 ? 'text-cyan-400' : 'text-rose-400'
                      }`}
                    >
                      {res.brandMentionCount > 0
                        ? `Cited (${res.brandMentionCount}x)`
                        : 'Not Mentioned'}
                    </span>
                  )}
                </div>

                {res.error ? (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                    <span>{res.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {segments.map((seg, sIdx) =>
                        seg.isMatch ? (
                          <mark
                            key={`seg-${sIdx}`}
                            className="rounded bg-cyan-500/20 px-1 py-0.5 font-semibold text-cyan-300"
                          >
                            {seg.text}
                          </mark>
                        ) : (
                          <span key={`seg-${sIdx}`}>{seg.text}</span>
                        )
                      )}
                    </div>

                    {res.citations.length > 0 && (
                      <div className="mt-4 border-t border-slate-800 pt-3">
                        <p className="mb-1.5 text-xs font-medium text-slate-400">
                          Returned Source Citations
                        </p>
                        <ul className="flex flex-col gap-1">
                          {res.citations.map((url, cIdx) => (
                            <li key={`cit-${cIdx}`}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-400 hover:underline break-all"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                                <span>{url}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
