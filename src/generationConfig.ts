export type GenerationReasoningLevel = 'low' | 'medium' | 'high';

export interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  enableGeminiWebSearch: boolean;
  reasoningLevel: GenerationReasoningLevel;
  showThinking: boolean;
  useReasoningWorker: boolean;
  inlineImages: boolean;
  useImageWorker: boolean;
  enableStreaming: boolean;
  autoCritique: boolean;
  multiDraft: boolean;
  rateLimitDelay: boolean;
  fullThinkingPrompt: boolean;
  contextWindowTokens: number;
  seed: number;
}

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  temperature: 1,
  topP: 0.9,
  topK: 48,
  maxOutputTokens: 65000,
  enableGeminiWebSearch: false,
  reasoningLevel: 'high',
  showThinking: false,
  useReasoningWorker: false,
  inlineImages: false,
  useImageWorker: false,
  enableStreaming: true,
  autoCritique: true,
  multiDraft: false,
  rateLimitDelay: false,
  fullThinkingPrompt: false,
  contextWindowTokens: 128000,
  seed: -1,
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

export function sanitizeGenerationConfig(input?: Partial<GenerationConfig> | Record<string, unknown>): GenerationConfig {
  const raw = (input || {}) as Record<string, unknown>;
  const fallback = DEFAULT_GENERATION_CONFIG;
  const reasoningLevelRaw = String(raw.reasoningLevel || fallback.reasoningLevel).toLowerCase();
  const reasoningLevel: GenerationReasoningLevel =
    reasoningLevelRaw === 'low' || reasoningLevelRaw === 'medium' || reasoningLevelRaw === 'high'
      ? reasoningLevelRaw
      : fallback.reasoningLevel;

  return {
    temperature: clampNumber(raw.temperature, fallback.temperature, 0, 2),
    topP: clampNumber(raw.topP, fallback.topP, 0, 1),
    topK: Math.round(clampNumber(raw.topK, fallback.topK, 1, 400)),
    maxOutputTokens: Math.round(clampNumber(raw.maxOutputTokens, fallback.maxOutputTokens, 64, 131072)),
    enableGeminiWebSearch: toBoolean(raw.enableGeminiWebSearch, fallback.enableGeminiWebSearch),
    reasoningLevel,
    showThinking: toBoolean(raw.showThinking, fallback.showThinking),
    useReasoningWorker: toBoolean(raw.useReasoningWorker, fallback.useReasoningWorker),
    inlineImages: toBoolean(raw.inlineImages, fallback.inlineImages),
    useImageWorker: toBoolean(raw.useImageWorker, fallback.useImageWorker),
    enableStreaming: toBoolean(raw.enableStreaming, fallback.enableStreaming),
    autoCritique: toBoolean(raw.autoCritique, fallback.autoCritique),
    multiDraft: toBoolean(raw.multiDraft, fallback.multiDraft),
    rateLimitDelay: toBoolean(raw.rateLimitDelay, fallback.rateLimitDelay),
    fullThinkingPrompt: toBoolean(raw.fullThinkingPrompt, fallback.fullThinkingPrompt),
    contextWindowTokens: Math.round(clampNumber(raw.contextWindowTokens, fallback.contextWindowTokens, 4096, 262144)),
    seed: Math.round(clampNumber(raw.seed, fallback.seed, -1, 2147483647)),
  };
}
