import { type GlossaryTerm, findGlossaryViolations, translateSegment } from '../phase0/aiGateway';
import type { Phase1GlossaryEntry, TmMatch } from './types';

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
