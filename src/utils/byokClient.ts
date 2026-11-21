import { SimulatorPromptResult, SimulatorProvider } from '../types/geo';

const SESSION_KEY_PREFIX = 'geo_studio_byok_key_';

export function getSessionApiKey(provider: SimulatorProvider): string {
  try {
    return sessionStorage.getItem(`${SESSION_KEY_PREFIX}${provider}`) || '';
  } catch {
    return '';
  }
}

export function setSessionApiKey(provider: SimulatorProvider, key: string): void {
  try {
    if (!key) {
      sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${provider}`);
    } else {
      sessionStorage.setItem(`${SESSION_KEY_PREFIX}${provider}`, key);
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function clearAllSessionApiKeys(): void {
  try {
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}openai`);
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}perplexity`);
  } catch {
    // Ignore
  }
}

export function buildSuggestedPrompts(topic: string): [string, string, string] {
  const clean = topic.trim() || 'B2B SaaS Payroll Automation';
  return [
    `What are the best tools for ${clean}?`,
    `How do B2B finance and ops teams evaluate ${clean} platforms in 2026?`,
    `Which ${clean} solutions offer the fastest ROI and lowest compliance risk?`,
  ];
}

function countBrandMentions(text: string, brandName: string): number {
  const clean = brandName.trim();
  if (!clean) return 0;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = text.match(new RegExp(`\\b${escaped}\\b`, 'gi'));
  return matches ? matches.length : 0;
}

function extractUrlsFromText(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)\]>,"']+/g) || [];
  return Array.from(new Set(matches));
}

export async function runByokPrompt(params: {
  provider: SimulatorProvider;
  apiKey: string;
  prompt: string;
  brandName: string;
}): Promise<SimulatorPromptResult> {
  const { provider, apiKey, prompt, brandName } = params;
  const trimmedKey = apiKey.trim();
  const trimmedPrompt = prompt.trim();

  if (!trimmedKey) {
    return {
      prompt: trimmedPrompt,
      responseText: '',
      brandMentionCount: 0,
      citations: [],
      model: provider === 'openai' ? 'gpt-4o-mini' : 'sonar',
      error: 'Missing API key.',
    };
  }

  const endpoint =
    provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.perplexity.ai/chat/completions';

  const model = provider === 'openai' ? 'gpt-4o-mini' : 'sonar';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trimmedKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 450,
        messages: [
          {
            role: 'system',
            content:
              'You are a concise B2B software analyst answering buyer-intent queries with specific vendor recommendations and verifiable reasoning.',
          },
          {
            role: 'user',
            content: trimmedPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        detail = errJson?.error?.message || detail;
      } catch {
        // ignore JSON parse failure
      }
      return {
        prompt: trimmedPrompt,
        responseText: '',
        brandMentionCount: 0,
        citations: [],
        model,
        error: `Provider returned an error: ${detail}`,
      };
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content || '';
    const apiCitations: string[] = Array.isArray(data?.citations)
      ? data.citations.filter((c: unknown): c is string => typeof c === 'string')
      : [];
    const inlineUrls = extractUrlsFromText(content);
    const mergedCitations = Array.from(new Set([...apiCitations, ...inlineUrls]));

    return {
      prompt: trimmedPrompt,
      responseText: content,
      brandMentionCount: countBrandMentions(content, brandName),
      citations: mergedCitations,
      model,
    };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Network or CORS error calling provider directly from browser.';
    return {
      prompt: trimmedPrompt,
      responseText: '',
      brandMentionCount: 0,
      citations: [],
      model,
      error: `${msg} (Check network connectivity or provider browser CORS policy.)`,
    };
  }
}
