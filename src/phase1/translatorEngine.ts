import { type GlossaryTerm, findGlossaryViolations, translateSegment } from '../phase0/aiGateway';
import type { Phase1GlossaryEntry, TmMatch } from './types';

const BULK_TRANSLATION_CACHE_KEY = 'phase1_translation_cache_v1';
const BULK_TRANSLATION_CHECKPOINT_PREFIX = 'phase1_translation_checkpoint_v1:';
const BULK_CACHE_LIMIT = 5000;

interface BulkCacheRecord {
  key: string;
  text: string;
  provider: string;
  status: 'translated' | 'pending';
  updatedAt: string;
}

interface BulkCheckpoint {
  jobKey: string;
  total: number;
  doneIds: string[];
  updatedAt: string;
}

export interface BulkTranslateProgress {
  done: number;
  total: number;
  cacheHits: number;
  failures: number;
  retries: number;
}

export interface BulkTranslateResultItem {
  segmentId: string;
  text: string;
  provider: string;
  status: 'translated' | 'pending';
  latencyMs: number;
  fromCache: boolean;
  retries: number;
}

export interface BulkTranslateSummary {
  jobKey: string;
  results: Record<string, BulkTranslateResultItem>;
  processed: number;
  cacheHits: number;
  failures: number;
  retries: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/storage errors to avoid breaking translation flow.
  }
}

function normalizeGlossaryForSignature(glossary: Phase1GlossaryEntry[]): string {
  return glossary
    .map((row) => `${row.source.trim()}=>${row.target.trim()}`)
    .filter((row) => row !== '=>')
    .sort()
    .join('|');
}

function buildBulkJobKey(input: {
  segments: SourceSegment[];
  glossary: Phase1GlossaryEntry[];
  tone: string;
  parallelMode: boolean;
}): string {
  const basis = [
    input.segments.map((segment) => `${segment.id}:${segment.text}`).join('\n'),
    normalizeGlossaryForSignature(input.glossary),
    input.tone,
    input.parallelMode ? 'parallel' : 'single',
  ].join('\n---\n');

  return `job-${hashSource(basis)}`;
}

function buildSegmentCacheKey(input: {
  segmentText: string;
  glossary: Phase1GlossaryEntry[];
  tone: string;
  parallelMode: boolean;
}): string {
  const basis = [
    input.segmentText,
    normalizeGlossaryForSignature(input.glossary),
    input.tone,
    input.parallelMode ? 'parallel' : 'single',
  ].join('\n---\n');

  return hashSource(basis);
}

function loadBulkCache(): Record<string, BulkCacheRecord> {
  return readJsonStorage<Record<string, BulkCacheRecord>>(BULK_TRANSLATION_CACHE_KEY, {});
}

function saveBulkCache(cache: Record<string, BulkCacheRecord>): void {
  const entries = Object.entries(cache)
    .sort((a, b) => new Date(b[1].updatedAt).getTime() - new Date(a[1].updatedAt).getTime())
    .slice(0, BULK_CACHE_LIMIT);
  writeJsonStorage(BULK_TRANSLATION_CACHE_KEY, Object.fromEntries(entries));
}

function loadCheckpoint(jobKey: string): BulkCheckpoint {
  const key = `${BULK_TRANSLATION_CHECKPOINT_PREFIX}${jobKey}`;
  return readJsonStorage<BulkCheckpoint>(key, {
    jobKey,
    total: 0,
    doneIds: [],
    updatedAt: new Date().toISOString(),
  });
}

function saveCheckpoint(checkpoint: BulkCheckpoint): void {
  const key = `${BULK_TRANSLATION_CHECKPOINT_PREFIX}${checkpoint.jobKey}`;
  writeJsonStorage(key, checkpoint);
}

export function clearBulkTranslationCheckpoint(jobKey: string): void {
  localStorage.removeItem(`${BULK_TRANSLATION_CHECKPOINT_PREFIX}${jobKey}`);
}

export function clearBulkTranslationCache(): void {
  localStorage.removeItem(BULK_TRANSLATION_CACHE_KEY);
}

export interface SourceSegment {
  id: string;
  text: string;
}

export function splitSourceToSegments(source: string): SourceSegment[] {
  const lines = source
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.map((line, idx) => ({ id: `seg-${idx + 1}`, text: line }));
  }

  return source
    .split(/(?<=[.!?\u3002\uFF01\uFF1F])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, idx) => ({ id: `seg-${idx + 1}`, text: line }));
}

export function glossaryToTerms(rows: Phase1GlossaryEntry[]): GlossaryTerm[] {
  return rows
    .filter((row) => row.source.trim() && row.target.trim())
    .map((row) => ({
      source: row.source.trim(),
      target: row.target.trim(),
    }));
}

export function applyGlossaryAutoFix(sourceText: string, translatedText: string, glossary: GlossaryTerm[]): string {
  let output = translatedText;

  glossary.forEach((term) => {
    if (!sourceText.includes(term.source)) return;

    const escaped = term.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    output = output.replace(new RegExp(escaped, 'g'), term.target);
  });

  return output;
}

export async function translateWithGlossary(input: {
  sourceText: string;
  glossary: Phase1GlossaryEntry[];
  tone: string;
  parallelMode?: boolean;
}): Promise<{
  provider: string;
  alternatives: string[];
  violationsByOption: string[][];
  comparisons: Array<{ provider: string; model: string; text: string; latencyMs: number }>;
  usage?: { sessionRequests: number; estimatedTokens: number; byProvider: Record<string, number>; byKey: Record<string, number> };
  failoverTrail: string[];
}> {
  const glossaryTerms = glossaryToTerms(input.glossary);
  const normalizeAlternatives = (rows: string[]): string[] => {
    const cleaned = rows
      .map((option) => String(option || '').trim())
      .filter(Boolean)
      .map((option) => applyGlossaryAutoFix(input.sourceText, option, glossaryTerms));
    if (!cleaned.length) return [];
    while (cleaned.length < 3) {
      cleaned.push(cleaned[cleaned.length - 1]);
    }
    return cleaned.slice(0, 3);
  };

  const runAttempt = async (tone: string, forceStrongModel = false, parallelProviders?: number) => {
    const response = await translateSegment({
      sourceText: input.sourceText,
      sourceLang: 'zh-CN',
      targetLang: 'vi-VN',
      glossary: glossaryTerms,
      tone,
      parallelProviders,
      forceStrongModel,
    });

    const alternatives = normalizeAlternatives(response.alternatives);
    const violationsByOption = alternatives.map((option) =>
      findGlossaryViolations(input.sourceText, option, glossaryTerms),
    );

    return {
      provider: response.provider,
      alternatives,
      violationsByOption,
      comparisons: response.comparisons || [],
      usage: response.usage,
      failoverTrail: response.failoverTrail || [],
    };
  };

  const primary = await runAttempt(input.tone, false, input.parallelMode ? 3 : 1);
  const hasCleanOption = primary.violationsByOption.some((list) => list.length === 0);
  const mustUseTerms = glossaryTerms.filter((term) => input.sourceText.includes(term.source));

  if (hasCleanOption || mustUseTerms.length === 0) {
    return primary;
  }

  const correctiveTone = [
    input.tone,
    'Hard glossary correction mode:',
    `Source contains MUST_USE terms: ${mustUseTerms.map((term) => `${term.source}=>${term.target}`).join(', ')}`,
    'You must return alternatives that include every required target term exactly.',
  ]
    .filter(Boolean)
    .join('\n');

  const retried = await runAttempt(correctiveTone, true, 1);
  const retriedHasClean = retried.violationsByOption.some((list) => list.length === 0);

  return {
    ...retried,
    failoverTrail: [
      ...primary.failoverTrail,
      'glossary_retry:triggered',
      ...retried.failoverTrail,
      ...(retriedHasClean ? [] : ['glossary_retry:hard_fail']),
    ],
  };
}

export async function translateSegmentsBulk(input: {
  segments: SourceSegment[];
  glossary: Phase1GlossaryEntry[];
  tone: string;
  parallelMode?: boolean;
  concurrency?: number;
  maxRetries?: number;
  baseRetryDelayMs?: number;
  preserveExisting?: Record<string, { text?: string | null } | undefined>;
  onProgress?: (progress: BulkTranslateProgress) => void;
}): Promise<BulkTranslateSummary> {
  const parallelMode = Boolean(input.parallelMode);
  const concurrency = Math.max(1, Math.min(input.concurrency || (parallelMode ? 6 : 4), 10));
  const maxRetries = Math.max(0, Math.min(input.maxRetries ?? 2, 5));
  const baseRetryDelayMs = Math.max(150, input.baseRetryDelayMs ?? 450);

  const jobKey = buildBulkJobKey({
    segments: input.segments,
    glossary: input.glossary,
    tone: input.tone,
    parallelMode,
  });

  const checkpoint = loadCheckpoint(jobKey);
  const doneIds = new Set(checkpoint.doneIds || []);
  const results: Record<string, BulkTranslateResultItem> = {};
  const cache = loadBulkCache();
  const durations: number[] = [];

  const hasExistingTranslation = (segmentId: string) => Boolean(input.preserveExisting?.[segmentId]?.text?.trim());
  const skippedByExisting = input.segments.filter((segment) => hasExistingTranslation(segment.id)).length;
  const skippedByCheckpoint = input.segments.filter((segment) => !hasExistingTranslation(segment.id) && doneIds.has(segment.id)).length;

  let done = skippedByExisting + skippedByCheckpoint;
  let cacheHits = 0;
  let failures = 0;
  let retries = 0;

  const markProgress = () => {
    input.onProgress?.({
      done,
      total: input.segments.length,
      cacheHits,
      failures,
      retries,
    });
  };

  const queue = input.segments.filter((segment) => {
    const existingText = input.preserveExisting?.[segment.id]?.text?.trim();
    if (existingText) return false;
    return !doneIds.has(segment.id);
  });

  markProgress();

  const updateCheckpointForSegment = (segmentId: string) => {
    doneIds.add(segmentId);
    saveCheckpoint({
      jobKey,
      total: input.segments.length,
      doneIds: Array.from(doneIds),
      updatedAt: new Date().toISOString(),
    });
  };

  const runOneSegment = async (segment: SourceSegment): Promise<void> => {
    const cacheKey = buildSegmentCacheKey({
      segmentText: segment.text,
      glossary: input.glossary,
      tone: input.tone,
      parallelMode,
    });

    const cached = cache[cacheKey];
    if (cached?.text?.trim()) {
      cacheHits += 1;
      done += 1;
      results[segment.id] = {
        segmentId: segment.id,
        text: cached.text,
        provider: cached.provider,
        status: cached.status,
        latencyMs: 0,
        fromCache: true,
        retries: 0,
      };
      updateCheckpointForSegment(segment.id);
      markProgress();
      return;
    }

    let lastError: unknown = null;
    const startedAt = performance.now();

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const translated = await translateWithGlossary({
          sourceText: segment.text,
          glossary: input.glossary,
          tone: input.tone,
          parallelMode,
        });

        const options = translated.alternatives.map((text, idx) => ({
          text,
          violations: translated.violationsByOption[idx] || [],
        }));

        const firstClean = options.find((option) => option.violations.length === 0);
        const chosen = firstClean || options[0];
        if (!chosen?.text) {
          throw new Error('No translated option returned');
        }

        const latencyMs = Math.max(1, Math.round(performance.now() - startedAt));
        durations.push(latencyMs);
        done += 1;

        const nextRecord: BulkTranslateResultItem = {
          segmentId: segment.id,
          text: chosen.text,
          provider: translated.provider,
          status: chosen.violations.length ? 'pending' : 'translated',
          latencyMs,
          fromCache: false,
          retries: attempt,
        };
        results[segment.id] = nextRecord;

        cache[cacheKey] = {
          key: cacheKey,
          text: chosen.text,
          provider: translated.provider,
          status: nextRecord.status,
          updatedAt: new Date().toISOString(),
        };

        if (attempt > 0) retries += attempt;
        updateCheckpointForSegment(segment.id);
        markProgress();
        return;
      } catch (error) {
        lastError = error;
        if (attempt >= maxRetries) break;
        const jitter = Math.floor(Math.random() * 120);
        const delay = baseRetryDelayMs * (2 ** attempt) + jitter;
        await sleep(delay);
      }
    }

    failures += 1;
    done += 1;
    const failedLatencyMs = Math.max(1, Math.round(performance.now() - startedAt));
    durations.push(failedLatencyMs);
    results[segment.id] = {
      segmentId: segment.id,
      text: '',
      provider: 'error',
      status: 'pending',
      latencyMs: failedLatencyMs,
      fromCache: false,
      retries: maxRetries,
    };
    markProgress();
    if (lastError instanceof Error) {
      // Preserve failed segment for manual retry, but keep pipeline going.
      console.warn(`Bulk translate failed for ${segment.id}: ${lastError.message}`);
    }
  };

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, Math.max(queue.length, 1)) }, async () => {
    while (cursor < queue.length) {
      const idx = cursor;
      cursor += 1;
      const segment = queue[idx];
      if (!segment) return;
      await runOneSegment(segment);
    }
  });

  await Promise.all(workers);
  saveBulkCache(cache);

  const sortedDurations = [...durations].sort((a, b) => a - b);
  const avgLatencyMs = sortedDurations.length
    ? Math.round(sortedDurations.reduce((sum, value) => sum + value, 0) / sortedDurations.length)
    : 0;
  const p95LatencyMs = sortedDurations.length
    ? sortedDurations[Math.min(sortedDurations.length - 1, Math.floor(sortedDurations.length * 0.95))]
    : 0;

  return {
    jobKey,
    results,
    processed: queue.length,
    cacheHits,
    failures,
    retries,
    avgLatencyMs,
    p95LatencyMs,
  };
}

export function hashSource(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `h-${(hash >>> 0).toString(16)}`;
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenDiceScore(a: string, b: string): number {
  const aa = normalizeForMatch(a).split(' ').filter(Boolean);
  const bb = normalizeForMatch(b).split(' ').filter(Boolean);

  if (!aa.length || !bb.length) return 0;

  const setA = new Set(aa);
  const setB = new Set(bb);
  let overlap = 0;

  setA.forEach((token) => {
    if (setB.has(token)) overlap += 1;
  });

  return (2 * overlap) / (setA.size + setB.size);
}

export function searchTmMatches(querySource: string, tm: Array<{ id: string; source: string; target: string }>): TmMatch[] {
  const normalizedQuery = normalizeForMatch(querySource);
  const exact: TmMatch[] = [];
  const fuzzy: TmMatch[] = [];

  tm.forEach((row) => {
    const normalizedSource = normalizeForMatch(row.source);
    if (!normalizedSource) return;

    if (normalizedSource === normalizedQuery) {
      exact.push({
        tmId: row.id,
        source: row.source,
        target: row.target,
        score: 1,
        matchType: 'exact',
      });
      return;
    }

    const score = tokenDiceScore(querySource, row.source);
    if (score >= 0.55) {
      fuzzy.push({
        tmId: row.id,
        source: row.source,
        target: row.target,
        score,
        matchType: 'fuzzy',
      });
    }
  });

  fuzzy.sort((a, b) => b.score - a.score);

  return [...exact, ...fuzzy].slice(0, 5);
}

export function buildTranslatedChapterText(
  segments: SourceSegment[],
  translations: Record<string, { text: string }>,
): string {
  return segments
    .map((seg) => translations[seg.id]?.text?.trim() || '')
    .filter(Boolean)
    .join('\n\n');
}
