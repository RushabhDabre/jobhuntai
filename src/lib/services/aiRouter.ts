import { GoogleGenAI } from '@google/genai';
import { UserProfile } from '@/types/job';
import { generateContentWithRetry, normalizeGeminiModel } from './gemini';
import { withTimeout } from '@/lib/timeout';

export type AiProvider = 'gemini' | 'groq' | 'openrouter' | 'openai' | 'claude' | 'grok';

export interface AiRequestOptions {
  prompt: string;
  systemPrompt?: string;
  responseJson?: boolean;
  profile?: UserProfile | null;
  customKeys?: {
    gemini?: string;
    groq?: string;
    openrouter?: string;
    openai?: string;
    claude?: string;
    grok?: string;
  };
  preferredProvider?: AiProvider;
  autoFailover?: boolean;
}

export interface AiExecutionResult {
  text: string;
  provider: AiProvider;
  model: string;
  didFailover: boolean;
  failoverReason?: string;
}

// -------------------------------------------------------------
// Individual Provider Callers
// -------------------------------------------------------------

async function callGemini(
  apiKey: string,
  prompt: string,
  systemPrompt?: string,
  responseJson?: boolean
): Promise<{ text: string; model: string }> {
  const client = new GoogleGenAI({ apiKey });
  const model = 'gemini-3.8-flash';

  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\nTask:\n${prompt}`
    : prompt;

  const res = await withTimeout(
    generateContentWithRetry(client, model, {
      contents: fullPrompt,
      ...(responseJson
        ? {
            config: {
              responseMimeType: 'application/json',
            },
          }
        : {}),
    }),
    11000,
    'Gemini generation timed out after 11s'
  );

  return {
    text: res.text || '',
    model: normalizeGeminiModel(model),
  };
}

async function callGroq(
  apiKey: string,
  prompt: string,
  systemPrompt?: string,
  responseJson?: boolean
): Promise<{ text: string; model: string }> {
  // llama-3.1-8b-instant is universally enabled for all free Groq accounts with highest TPM
  const candidateModels = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
  ];

  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];

  let lastError: unknown;

  for (const model of candidateModels) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          ...(responseJson ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 404 || errText.includes('model_not_found') || errText.includes('does not exist')) {
          console.warn(`[Groq] Model ${model} not accessible on key, trying next model...`);
          lastError = new Error(`Groq API Error (${res.status}): ${errText}`);
          continue;
        }
        throw new Error(`Groq API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      return { text, model };
    } catch (err: unknown) {
      lastError = err;
      const msg = String(err).toLowerCase();
      if (msg.includes('404') || msg.includes('model_not_found') || msg.includes('does not exist')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

async function callOpenRouter(
  apiKey: string,
  prompt: string,
  systemPrompt?: string,
  responseJson?: boolean
): Promise<{ text: string; model: string }> {
  const candidateModels = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
  ];

  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];

  let lastError: unknown;

  for (const model of candidateModels) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jobhuntai.app',
          'X-Title': 'JobHuntAI Candidate Engine',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          ...(responseJson ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 404 || errText.includes('model_not_found')) {
          console.warn(`[OpenRouter] Model ${model} not found, trying fallback...`);
          lastError = new Error(`OpenRouter API Error (${res.status}): ${errText}`);
          continue;
        }
        throw new Error(`OpenRouter API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      return { text, model };
    } catch (err: unknown) {
      lastError = err;
      const msg = String(err).toLowerCase();
      if (msg.includes('404') || msg.includes('model_not_found')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

async function callOpenAI(
  apiKey: string,
  prompt: string,
  systemPrompt?: string,
  responseJson?: boolean
): Promise<{ text: string; model: string }> {
  const model = 'gpt-4o-mini';
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      ...(responseJson ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  return { text, model };
}

async function callClaude(
  apiKey: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ text: string; model: string }> {
  const model = 'claude-3-5-haiku-20241022';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
    headers: {
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic Claude Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text || '';
  return { text, model };
}

async function callGrok(
  apiKey: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ text: string; model: string }> {
  const model = 'grok-beta';
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`xAI Grok Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  return { text, model };
}

// -------------------------------------------------------------
// Multi-Engine Auto-Failover Orchestrator
// -------------------------------------------------------------

export async function executeAiWithFailover(
  options: AiRequestOptions
): Promise<AiExecutionResult> {
  const {
    prompt,
    systemPrompt,
    responseJson = false,
    profile,
    customKeys = {},
    autoFailover = profile?.autoFailover !== false,
  } = options;

  // Resolve keys per provider from customKeys or userProfile
  const keys: Record<AiProvider, string | undefined> = {
    gemini: customKeys.gemini || profile?.geminiApiKey,
    groq: customKeys.groq || profile?.groqApiKey,
    openrouter: customKeys.openrouter || profile?.openRouterApiKey,
    openai: customKeys.openai || profile?.openaiApiKey,
    claude: customKeys.claude || profile?.anthropicApiKey,
    grok: customKeys.grok || profile?.grokApiKey,
  };

  const preferred: AiProvider =
    options.preferredProvider || profile?.preferredAiProvider || 'gemini';

  // Construct provider order: preferred first, then remaining configured providers
  const availableProviders = (
    ['gemini', 'groq', 'openrouter', 'openai', 'claude', 'grok'] as AiProvider[]
  ).filter((p) => Boolean(keys[p]?.trim()));

  if (availableProviders.length === 0) {
    throw new Error(
      'No AI API key is connected. Please connect a free Gemini key (Google AI Studio) or free Groq key (Groq Console) in Settings or the setup wizard.'
    );
  }

  const executionQueue: AiProvider[] = [
    preferred,
    ...availableProviders.filter((p) => p !== preferred),
  ].filter((p, idx, arr) => arr.indexOf(p) === idx && Boolean(keys[p]?.trim()));

  let lastError: unknown;
  let didFailover = false;
  let failoverReason: string | undefined;

  for (let i = 0; i < executionQueue.length; i++) {
    const provider = executionQueue[i];
    const key = keys[provider]?.trim();

    if (!key) continue;

    try {
      let result: { text: string; model: string };

      if (provider === 'gemini') {
        result = await callGemini(key, prompt, systemPrompt, responseJson);
      } else if (provider === 'groq') {
        result = await callGroq(key, prompt, systemPrompt, responseJson);
      } else if (provider === 'openrouter') {
        result = await callOpenRouter(key, prompt, systemPrompt, responseJson);
      } else if (provider === 'openai') {
        result = await callOpenAI(key, prompt, systemPrompt, responseJson);
      } else if (provider === 'claude') {
        result = await callClaude(key, prompt, systemPrompt);
      } else if (provider === 'grok') {
        result = await callGrok(key, prompt, systemPrompt);
      } else {
        continue;
      }

      return {
        text: result.text,
        provider,
        model: result.model,
        didFailover,
        failoverReason,
      };
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Router] ${provider} execution failed:`, errMsg);

      if (!autoFailover) {
        throw err;
      }

      didFailover = true;
      failoverReason = `${provider} error: ${errMsg.slice(0, 100)}`;
      // Continue to next available provider in queue
    }
  }

  throw lastError;
}
