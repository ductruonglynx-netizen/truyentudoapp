export interface ChapterDraftSchema {
  title: string;
  content: string;
}

export interface StoryAnalysisSchema {
  summary: string;
  writingStyle: string;
  currentContext: string;
  genre: string;
  characters: Array<{ name: string; personality: string }>;
}

export interface StoryPlanSchema {
  chapters: Array<{ title: string; outline: string }>;
}

export interface SchemaValidationResult<T> {
  ok: boolean;
  data: T;
  error?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function validateChapterDraftArray(payload: unknown, minItems = 1): SchemaValidationResult<ChapterDraftSchema[]> {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(asRecord(payload)?.chapters)
      ? (asRecord(payload)?.chapters as unknown[])
      : [];
  const data = records
    .map((item, index) => {
      const row = asRecord(item);
      const title = String(row?.title || '').trim() || `Chương ${index + 1}`;
      const content = String(row?.content || row?.outline || '').trim();
      return { title, content };
    })
    .filter((item) => item.content.length > 0);

  if (data.length < Math.max(1, minItems)) {
    return { ok: false, data: [], error: 'chapter_draft_array_invalid_or_empty' };
  }
  return { ok: true, data };
}

export function validateStoryAnalysis(payload: unknown): SchemaValidationResult<StoryAnalysisSchema> {
  const row = asRecord(payload);
  const characters = Array.isArray(row?.characters)
    ? row.characters
        .map((item) => {
          const person = asRecord(item);
          if (!person) return null;
          return {
            name: String(person.name || '').trim(),
            personality: String(person.personality || '').trim(),
          };
        })
        .filter((item): item is { name: string; personality: string } => Boolean(item && item.name))
    : [];

  const data: StoryAnalysisSchema = {
    summary: String(row?.summary || '').trim(),
    writingStyle: String(row?.writingStyle || '').trim(),
    currentContext: String(row?.currentContext || '').trim(),
    genre: String(row?.genre || '').trim(),
    characters,
  };

  if (!data.summary) {
    return { ok: false, data, error: 'analysis_missing_summary' };
  }
  return { ok: true, data };
}

export function validateStoryPlan(payload: unknown, minItems = 1): SchemaValidationResult<StoryPlanSchema> {
  const row = asRecord(payload);
  const chaptersSource = Array.isArray(row?.chapters) ? row.chapters : (Array.isArray(payload) ? payload : []);
  const chapters = chaptersSource
    .map((item, index) => {
      const chapter = asRecord(item);
      return {
        title: String(chapter?.title || '').trim() || `Chương ${index + 1}`,
        outline: String(chapter?.outline || chapter?.content || '').trim(),
      };
    })
    .filter((chapter) => chapter.outline.length > 0);

  const data: StoryPlanSchema = { chapters };
  if (chapters.length < Math.max(1, minItems)) {
    return { ok: false, data, error: 'plan_missing_chapters' };
  }
  return { ok: true, data };
}
