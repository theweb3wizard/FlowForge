const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

export type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type RequestBody = {
  model: string;
  messages: OpenRouterMessage[];
  stream?: boolean;
  response_format?: { type: 'json_object' };
};

// Priority-ordered free models verified working as of June 2026.
// Tried sequentially; each failure falls through to the next.
// Benchmarked latency: llama-3.3 (1s) < mistral-nemo (2s) < llama-4 (2s) < qwen (4.5s) < deepseek (4.7s)
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-nemo',
  'meta-llama/llama-3.1-8b-instruct',
  'deepseek/deepseek-chat',
  'qwen/qwen-2.5-72b-instruct',
];

// Models for deep tasks (audit, recipe generation) — prioritize quality over speed
const DEEP_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-chat',
];

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');
  return key;
}

async function tryModel(
  body: RequestBody,
  signal?: AbortSignal,
): Promise<Response> {
  const key = getApiKey();
  return fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app',
      'X-Title': 'FlowForge',
    },
    body: JSON.stringify(body),
    signal,
  });
}

// Models that should NOT be retried (waste of quota)
const FATAL_STATUSES = new Set([400, 401, 402, 422]);

function getModelList(depth: 'fast' | 'deep'): string[] {
  return depth === 'deep' ? DEEP_MODELS : FREE_MODELS;
}

/*
 * The OpenRouter free tier has per-model rate limits (~20 RPM).
 * We try models sequentially so that if one is rate-limited (429)
 * or temporarily down (5xx), we transparently fall through to the next.
 */
async function executeWithFallback(
  messages: OpenRouterMessage[],
  modelList: string[],
  buildBody: (model: string) => RequestBody,
  signal?: AbortSignal,
): Promise<Response> {
  let lastError: Error | null = null;

  for (const model of modelList) {
    try {
      const res = await tryModel(buildBody(model), signal);

      if (res.ok) return res;

      const status = res.status;
      const text = await res.text();

      // Fatal — no point trying other models (bad prompt, auth, etc.)
      if (FATAL_STATUSES.has(status)) {
        throw new Error(`OpenRouter ${status}: ${text}`);
      }

      // Non-fatal — try next model (rate limit, overload, timeout)
      console.warn(`[OpenRouter] ${model} returned ${status}, trying next model`);
      lastError = new Error(`OpenRouter ${status} from all models`);

      // Small delay before next model (rate-limit backoff)
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      if (err instanceof Error && FATAL_STATUSES.has(Number((err as any).status))) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[OpenRouter] ${model} failed: ${lastError.message}, trying next`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  throw lastError ?? new Error('All OpenRouter models failed');
}

export async function generateStream(
  messages: OpenRouterMessage[],
  onChunk: (text: string) => void,
  options?: { signal?: AbortSignal; depth?: 'fast' | 'deep' },
): Promise<void> {
  const modelList = getModelList(options?.depth ?? 'fast');
  const res = await executeWithFallback(
    messages,
    modelList,
    (model) => ({ model, messages, stream: true }),
    options?.signal,
  );

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') return;

      try {
        const json = JSON.parse(payload);
        const text = json.choices?.[0]?.delta?.content ?? '';
        if (text) onChunk(text);
      } catch {
        // Skip malformed chunks
      }
    }
  }
}

export async function generateJSON<T>(
  messages: OpenRouterMessage[],
  options?: { signal?: AbortSignal; depth?: 'fast' | 'deep' },
): Promise<T> {
  const modelList = getModelList(options?.depth ?? 'deep');
  const res = await executeWithFallback(
    messages,
    modelList,
    (model) => ({ model, messages, response_format: { type: 'json_object' } as const }),
    options?.signal,
  );

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenRouter');

  // Handle cases where the model wraps JSON in markdown fences
  const cleaned = text.replace(/^```(?:json)?\s*|```\s*$/g, '').trim();
  return JSON.parse(cleaned) as T;
}

export async function generateText(
  messages: OpenRouterMessage[],
  options?: { signal?: AbortSignal; depth?: 'fast' | 'deep' },
): Promise<string> {
  const modelList = getModelList(options?.depth ?? 'fast');
  const res = await executeWithFallback(
    messages,
    modelList,
    (model) => ({ model, messages }),
    options?.signal,
  );

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}
