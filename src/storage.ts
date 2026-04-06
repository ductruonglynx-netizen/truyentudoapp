import { loadBudgetState, saveBudgetState, type BudgetState } from './finops';
import { loadPromptLibraryState, savePromptLibraryState } from './promptLibraryStore';
import { emitLocalWorkspaceChanged } from './localWorkspaceSync';
import { getScopedStorageItem, setScopedStorageItem, shouldAllowLegacyScopeFallback, removeScopedStorageItem } from './workspaceScope';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

const SAFE_IMPORT_BACKUP_KEY = 'safe_import_backup_v1';
const STORIES_BACKUP_HISTORY_KEY = 'stories_backup_history_v1';
const STORIES_BACKUP_LIMIT = 12;
const STORIES_STORAGE_CODEC_PREFIX = 'lzutf16:';
const STORIES_STORAGE_COMPRESSION_THRESHOLD = 260_000;
const STORIES_PAYLOAD_SOFT_LIMIT_BYTES = 14 * 1024 * 1024;
const STORIES_KEY = 'stories';
const STORIES_INDEX_KEY = 'stories_index_v2';
const STORIES_ITEM_KEY_PREFIX = 'stories_item_v2:';
const CHARACTERS_KEY = 'characters';
const AI_RULES_KEY = 'ai_rules';
const STYLE_REFERENCES_KEY = 'style_references';
const TRANSLATION_NAMES_KEY = 'translation_names';
const UI_PROFILE_KEY = 'ui_profile_v1';
const UI_THEME_KEY = 'ui_theme_v1';
const UI_VIEWPORT_MODE_KEY = 'ui_viewport_mode_v1';
const READER_PREFS_KEY = 'reader_prefs_v1';
const API_KEYS_KEY = 'api_keys';
export const STORAGE_SAVE_FAILED_EVENT = 'truyenforge:storage-save-failed';

const IMPORT_MAX_STORIES = 240;
const IMPORT_MAX_CHAPTERS_PER_STORY = 1600;
const IMPORT_MAX_CHARACTERS = 12_000;
const IMPORT_MAX_AI_RULES = 2_000;
const IMPORT_MAX_STYLE_REFERENCES = 2_000;
const IMPORT_MAX_TRANSLATION_NAMES = 12_000;
const IMPORT_MAX_STORY_CONTENT_CHARS = 2_000_000;
const IMPORT_MAX_CHAPTER_CONTENT_CHARS = 550_000;
const IMPORT_MAX_PROMPT_ITEMS = 400;

export interface StorageSaveFailedDetail {
  section: 'stories' | 'characters' | 'ai_rules' | 'style_references' | 'translation_names';
  reason: 'quota' | 'unknown';
  message: string;
  estimatedBytes?: number;
  timestamp: string;
}

export interface StoryListItem {
  id: string;
  authorId: string;
  title: string;
  introduction: string;
  genre: string;
  type: string;
  isPublic: boolean;
  isAdult: boolean;
  isAI: boolean;
  coverImageUrl: string;
  expectedChapters: number;
  expectedWordCount: number;
  createdAt: string;
  updatedAt: string;
  chapterCount: number;
}

const normalizeDate = (value: any) => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : value;
  }
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
};

const normalizeRevision = (value: unknown, fallback = 1) => {
  const next = Number(value);
  if (!Number.isFinite(next)) return Math.max(1, fallback);
  return Math.max(1, Math.floor(next));
};

const normalizeChapters = (chapters: any[]) =>
  (Array.isArray(chapters) ? chapters : []).map((chapter) => ({
    ...chapter,
    id: String(chapter?.id || `chapter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    title: String(chapter?.title || '').trim(),
    content: String(chapter?.content || ''),
    order: Number.isFinite(Number(chapter?.order)) ? Number(chapter.order) : 0,
    createdAt: normalizeDate(chapter?.createdAt),
    updatedAt: normalizeDate(chapter?.updatedAt || chapter?.createdAt),
    revision: normalizeRevision(chapter?.revision, 1),
  }));

const normalizeCoverImageUrl = (value: any) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const normalizeTranslationMemory = (rows: any[]) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      original: String(row?.original || '').trim(),
      translation: String(row?.translation || '').trim(),
    }))
    .filter((row) => row.original && row.translation);

const normalizeCharacterRoster = (rows: any[]) =>
  (Array.isArray(rows) ? rows : [])
    .map((row, index) => ({
      id: String(row?.id || `roster-${index}-${Date.now()}`),
      name: String(row?.name || '').trim(),
      role: String(row?.role || '').trim(),
      age: String(row?.age || '').trim(),
      identity: String(row?.identity || '').trim(),
    }))
    .filter((row) => row.name);

const normalizeStory = (story: any) => ({
  ...story,
  id: String(story?.id || `story-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
  title: String(story?.title || '').trim(),
  content: String(story?.content || ''),
  coverImageUrl: normalizeCoverImageUrl(story?.coverImageUrl),
  createdAt: normalizeDate(story?.createdAt),
  updatedAt: normalizeDate(story?.updatedAt),
  revision: normalizeRevision(story?.revision, 1),
  chapters: normalizeChapters(story?.chapters),
  translationMemory: normalizeTranslationMemory(story?.translationMemory),
  storyPromptNotes: String(story?.storyPromptNotes || '').trim(),
  characterRoster: normalizeCharacterRoster(story?.characterRoster),
  deletedChapterIds: normalizeDeletedChapterIds(story?.deletedChapterIds),
});

function normalizeDeletedChapterIds(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const next: Record<string, string> = {};
  Object.entries(value as Record<string, unknown>).forEach(([chapterId, deletedAt]) => {
    const id = String(chapterId || '').trim();
    const raw = String(deletedAt || '').trim();
    if (!id || !raw) return;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return;
    next[id] = raw;
  });
  return next;
}

function areChapterContentsEqual(a: any, b: any): boolean {
  return String(a?.title || '') === String(b?.title || '')
    && String(a?.content || '') === String(b?.content || '')
    && Number(a?.order || 0) === Number(b?.order || 0)
    && String(a?.aiInstructions || '') === String(b?.aiInstructions || '')
    && String(a?.script || '') === String(b?.script || '');
}

function areStoriesEquivalent(a: any, b: any): boolean {
  const aChapters = Array.isArray(a?.chapters) ? a.chapters : [];
  const bChapters = Array.isArray(b?.chapters) ? b.chapters : [];
  if (aChapters.length !== bChapters.length) return false;
  for (let i = 0; i < aChapters.length; i += 1) {
    if (!areChapterContentsEqual(aChapters[i], bChapters[i])) return false;
  }
  return String(a?.title || '') === String(b?.title || '')
    && String(a?.content || '') === String(b?.content || '')
    && String(a?.introduction || '') === String(b?.introduction || '')
    && String(a?.genre || '') === String(b?.genre || '')
    && String(a?.type || '') === String(b?.type || '')
    && String(a?.coverImageUrl || '') === String(b?.coverImageUrl || '')
    && String(a?.storyPromptNotes || '') === String(b?.storyPromptNotes || '')
    && Boolean(a?.isPublic) === Boolean(b?.isPublic)
    && Boolean(a?.isAdult) === Boolean(b?.isAdult)
    && Boolean(a?.isAI) === Boolean(b?.isAI)
    && Number(a?.expectedChapters || 0) === Number(b?.expectedChapters || 0)
    && Number(a?.expectedWordCount || 0) === Number(b?.expectedWordCount || 0)
    && JSON.stringify(Array.isArray(a?.translationMemory) ? a.translationMemory : []) === JSON.stringify(Array.isArray(b?.translationMemory) ? b.translationMemory : [])
    && JSON.stringify(Array.isArray(a?.characterRoster) ? a.characterRoster : []) === JSON.stringify(Array.isArray(b?.characterRoster) ? b.characterRoster : [])
    && JSON.stringify(normalizeDeletedChapterIds(a?.deletedChapterIds)) === JSON.stringify(normalizeDeletedChapterIds(b?.deletedChapterIds));
}

function withRevisionBumps(nextStories: any[], previousStories: any[]): any[] {
  const previousById = new Map(
    (Array.isArray(previousStories) ? previousStories : [])
      .map((story) => [String(story?.id || ''), story]),
  );
  return (Array.isArray(nextStories) ? nextStories : []).map((nextStory) => {
    const current = normalizeStory(nextStory);
    const previous = previousById.get(current.id);
    if (!previous) {
      const chapters = normalizeChapters(current.chapters).map((chapter) => ({
        ...chapter,
        revision: normalizeRevision(chapter.revision, 1),
      }));
      return {
        ...current,
        revision: normalizeRevision(current.revision, 1),
        chapters,
      };
    }

    const previousChaptersById = new Map(
      (Array.isArray(previous.chapters) ? previous.chapters : [])
        .map((chapter: any) => [String(chapter?.id || ''), chapter]),
    );
    const chapters = normalizeChapters(current.chapters).map((chapter) => {
      const previousChapter = previousChaptersById.get(chapter.id);
      if (!previousChapter) {
        return {
          ...chapter,
          revision: normalizeRevision(chapter.revision, 1),
        };
      }
      const changed = !areChapterContentsEqual(chapter, previousChapter);
      const previousRevision = normalizeRevision((previousChapter as any)?.revision, 1);
      return {
        ...chapter,
        revision: changed ? previousRevision + 1 : previousRevision,
      };
    });

    const changed = !areStoriesEquivalent({ ...current, chapters }, previous);
    const previousRevision = normalizeRevision(previous.revision, 1);
    return {
      ...current,
      revision: changed ? previousRevision + 1 : previousRevision,
      chapters,
    };
  });
}

function safeParseArray(raw: string | null): any[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getScopedRaw(baseKey: string): string | null {
  return getScopedStorageItem(baseKey, {
    allowLegacyFallback: shouldAllowLegacyScopeFallback(),
  });
}

function setScopedRaw(baseKey: string, value: string): void {
  setScopedStorageItem(baseKey, value);
}

function removeScopedRaw(baseKey: string): void {
  removeScopedStorageItem(baseKey);
}

function getStoryItemKey(storyId: string): string {
  return `${STORIES_ITEM_KEY_PREFIX}${storyId}`;
}

function toStoryListItem(story: any): StoryListItem {
  const normalized = normalizeStory(story);
  return {
    id: String(normalized.id || ''),
    authorId: String(normalized.authorId || ''),
    title: String(normalized.title || ''),
    introduction: String(normalized.introduction || ''),
    genre: String(normalized.genre || ''),
    type: String(normalized.type || 'original'),
    isPublic: Boolean(normalized.isPublic),
    isAdult: Boolean(normalized.isAdult),
    isAI: Boolean(normalized.isAI),
    coverImageUrl: normalizeCoverImageUrl(normalized.coverImageUrl),
    expectedChapters: Math.max(0, Number(normalized.expectedChapters || 0)),
    expectedWordCount: Math.max(0, Number(normalized.expectedWordCount || 0)),
    createdAt: normalizeDate(normalized.createdAt),
    updatedAt: normalizeDate(normalized.updatedAt),
    chapterCount: Array.isArray(normalized.chapters) ? normalized.chapters.length : 0,
  };
}

function readStoryByIdFromSegmentedStorage(storyId: string): any | null {
  const targetId = String(storyId || '').trim();
  if (!targetId) return null;
  const raw = getScopedRaw(getStoryItemKey(targetId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeStory(parsed);
  } catch {
    return null;
  }
}

function readStoryIndex(): string[] {
  try {
    const raw = getScopedRaw(STORIES_INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function readStoriesFromSegmentedStorage(): any[] {
  const index = readStoryIndex();
  if (!index.length) return [];
  const stories: any[] = [];
  index.forEach((storyId) => {
    const raw = getScopedRaw(getStoryItemKey(storyId));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        stories.push(normalizeStory(parsed));
      }
    } catch {
      // Skip corrupted item.
    }
  });
  return stories;
}

function writeStoriesToSegmentedStorage(stories: any[]): void {
  const normalized = Array.isArray(stories) ? stories.map(normalizeStory) : [];
  const previousIndex = readStoryIndex();
  const nextIndex = normalized.map((story) => String(story.id || '').trim()).filter(Boolean);
  const nextIndexSet = new Set(nextIndex);
  normalized.forEach((story) => {
    setScopedRaw(getStoryItemKey(story.id), JSON.stringify(story));
  });
  previousIndex.forEach((storyId) => {
    if (!nextIndexSet.has(storyId)) {
      removeScopedRaw(getStoryItemKey(storyId));
    }
  });
  setScopedRaw(STORIES_INDEX_KEY, JSON.stringify(nextIndex));
  // Dọn bản lưu legacy cũ để tránh mỗi lần ghi lại phải stringify cả mảng lớn.
  removeScopedRaw(STORIES_KEY);
}

function decodeStoriesPayload(raw: string | null): any[] {
  if (!raw) return [];
  try {
    const decoded = raw.startsWith(STORIES_STORAGE_CODEC_PREFIX)
      ? (decompressFromUTF16(raw.slice(STORIES_STORAGE_CODEC_PREFIX.length)) || '[]')
      : raw;
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function encodeStoriesPayload(stories: any[]): string {
  const normalizedStories = Array.isArray(stories) ? stories.map(normalizeStory) : [];
  const json = JSON.stringify(normalizedStories);
  if (json.length < STORIES_STORAGE_COMPRESSION_THRESHOLD) {
    return json;
  }
  const compressed = compressToUTF16(json);
  if (!compressed) {
    return json;
  }
  return `${STORIES_STORAGE_CODEC_PREFIX}${compressed}`;
}

function buildStoriesFingerprint(stories: any[]): string {
  const normalizedStories = Array.isArray(stories) ? stories : [];
  const storyCount = normalizedStories.length;
  const chapterCount = normalizedStories.reduce((sum, story) => sum + (Array.isArray(story?.chapters) ? story.chapters.length : 0), 0);
  const totalChars = normalizedStories.reduce((sum, story) => sum + Number(String(story?.content || '').length), 0);
  const storyIds = normalizedStories
    .slice(0, 8)
    .map((story) => String(story?.id || '').trim())
    .join('|');
  return `${storyCount}:${chapterCount}:${totalChars}:${storyIds}`;
}

function backupStoriesSnapshot(stories: any[]): void {
  try {
    const normalizedStories = Array.isArray(stories) ? stories.map(normalizeStory) : [];
    const existingRaw = getScopedRaw(STORIES_BACKUP_HISTORY_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : null;
    const legacyHistory = Array.isArray(existing) ? existing : [];
    const history = Array.isArray((existing as { entries?: unknown })?.entries)
      ? ((existing as { entries: Array<{ savedAt?: string; storyCount?: number; chapterCount?: number; totalChars?: number; fingerprint?: string }> }).entries)
      : legacyHistory
        .map((item) => ({
          savedAt: typeof item?.savedAt === 'string' ? item.savedAt : new Date().toISOString(),
          storyCount: Array.isArray(item?.stories) ? item.stories.length : 0,
          chapterCount: Array.isArray(item?.stories)
            ? item.stories.reduce((sum: number, story: any) => sum + (Array.isArray(story?.chapters) ? story.chapters.length : 0), 0)
            : 0,
          totalChars: Array.isArray(item?.stories)
            ? item.stories.reduce((sum: number, story: any) => sum + Number(String(story?.content || '').length), 0)
            : 0,
          fingerprint: Array.isArray(item?.stories) ? buildStoriesFingerprint(item.stories) : '',
        }))
        .filter((item) => item.fingerprint);

    const storyCount = normalizedStories.length;
    const chapterCount = normalizedStories.reduce((sum, story) => sum + (Array.isArray(story?.chapters) ? story.chapters.length : 0), 0);
    const totalChars = normalizedStories.reduce((sum, story) => sum + Number(String(story?.content || '').length), 0);
    const fingerprint = buildStoriesFingerprint(normalizedStories);
    const lastEntry = history[history.length - 1];
    if (lastEntry?.fingerprint === fingerprint) return;

    const nextHistory = [
      ...history,
      {
        savedAt: new Date().toISOString(),
        storyCount,
        chapterCount,
        totalChars,
        fingerprint,
      },
    ].slice(-STORIES_BACKUP_LIMIT);

    setScopedRaw(STORIES_BACKUP_HISTORY_KEY, JSON.stringify({
      schemaVersion: 2,
      entries: nextHistory,
    }));
  } catch {
    // Keep primary save path alive even if backup history fails.
  }
}

function estimateUtf16Bytes(value: unknown): number {
  try {
    return JSON.stringify(value).length * 2;
  } catch {
    return 0;
  }
}

function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.code === 22;
  }
  const text = String((error as { message?: unknown })?.message || error || '').toLowerCase();
  return text.includes('quota') || text.includes('exceeded');
}

function emitStorageSaveFailed(detail: StorageSaveFailedDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<StorageSaveFailedDetail>(STORAGE_SAVE_FAILED_EVENT, {
    detail,
  }));
}

function failSaveWithNotice(input: {
  section: StorageSaveFailedDetail['section'];
  error: unknown;
  estimatedBytes?: number;
}): never {
  const quota = isQuotaError(input.error);
  const message = quota
    ? 'Không thể lưu vì bộ nhớ trình duyệt đã đầy.'
    : 'Không thể lưu dữ liệu do lỗi bộ nhớ cục bộ.';
  emitStorageSaveFailed({
    section: input.section,
    reason: quota ? 'quota' : 'unknown',
    message,
    estimatedBytes: input.estimatedBytes,
    timestamp: new Date().toISOString(),
  });
  throw new Error(`${message} Hãy mở Sao lưu để tải JSON ra máy hoặc dọn dữ liệu cũ trước khi lưu lại.`);
}

function setScopedRawGuarded(
  baseKey: string,
  value: string,
  section: StorageSaveFailedDetail['section'],
): void {
  try {
    setScopedRaw(baseKey, value);
  } catch (error) {
    failSaveWithNotice({
      section,
      error,
      estimatedBytes: Math.max(0, value.length * 2),
    });
  }
}

function sanitizeImportStories(rows: any[]): any[] {
  return (Array.isArray(rows) ? rows : [])
    .slice(0, IMPORT_MAX_STORIES)
    .map((story) => {
      const normalized = normalizeStory(story);
      const chapters = normalizeChapters(normalized.chapters)
        .slice(0, IMPORT_MAX_CHAPTERS_PER_STORY)
        .map((chapter) => ({
          ...chapter,
          title: String(chapter?.title || '').slice(0, 320),
          content: String(chapter?.content || '').slice(0, IMPORT_MAX_CHAPTER_CONTENT_CHARS),
        }));
      return {
        ...normalized,
        title: String(normalized.title || '').slice(0, 480),
        content: String(normalized.content || '').slice(0, IMPORT_MAX_STORY_CONTENT_CHARS),
        chapters,
        deletedChapterIds: normalizeDeletedChapterIds(normalized.deletedChapterIds),
      };
    });
}

function sanitizeImportObjectArray(rows: unknown, maxItems: number): Record<string, unknown>[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .slice(0, maxItems)
    .filter((item): item is Record<string, unknown> => isPlainObject(item));
}

export interface StorageExportReport {
  filename: string;
  excludedSecrets: string[];
}

export interface StorageImportReport {
  restoredSections: string[];
  skippedSections: string[];
}

export interface StorageBackupPayload {
  schemaVersion: number;
  stories: any[];
  characters: any[];
  ai_rules: any[];
  style_references: any[];
  translation_names: any[];
  prompt_library: ReturnType<typeof loadPromptLibraryState>;
  ui_profile: Record<string, unknown> | null;
  ui_theme: string;
  ui_viewport_mode: string;
  reader_prefs: Record<string, unknown> | null;
  finops_budget: BudgetState;
  exportDate: string;
  note: string;
}

function buildBackupPayload(): StorageBackupPayload {
  const profileRaw = getScopedRaw(UI_PROFILE_KEY);
  const themeRaw = getScopedRaw(UI_THEME_KEY);
  const viewportRaw = getScopedRaw(UI_VIEWPORT_MODE_KEY);
  const readerPrefsRaw = getScopedRaw(READER_PREFS_KEY);
  return {
    schemaVersion: 2,
    stories: storage.getStories(),
    characters: storage.getCharacters(),
    ai_rules: storage.getAIRules(),
    style_references: storage.getStyleReferences(),
    translation_names: storage.getTranslationNames(),
    prompt_library: loadPromptLibraryState(),
    ui_profile: profileRaw ? JSON.parse(profileRaw) : null,
    ui_theme: themeRaw || 'light',
    ui_viewport_mode: viewportRaw || 'desktop',
    reader_prefs: readerPrefsRaw ? JSON.parse(readerPrefsRaw) : null,
    finops_budget: loadBudgetState(),
    exportDate: new Date().toISOString(),
    note: 'API keys va runtime secrets duoc loai khoi backup de tranh ro ri thong tin nhay cam.',
  };
}

function downloadBackupPayload(payload: StorageBackupPayload, filename?: string): string {
  const resolvedFilename = filename || `truyenforge-backup-${new Date().toISOString().split('T')[0]}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = resolvedFilename;
  a.click();
  URL.revokeObjectURL(url);
  return resolvedFilename;
}

export const storage = {
  getStoryIds: () => {
    const segmented = readStoryIndex();
    if (segmented.length > 0) return segmented;
    return storage.getStories().map((story) => String(story?.id || '')).filter(Boolean);
  },
  getStoryById: (storyId: string) => {
    const segmented = readStoryByIdFromSegmentedStorage(storyId);
    if (segmented) return segmented;
    const all = storage.getStories();
    return all.find((story) => String(story?.id || '') === String(storyId || '').trim()) || null;
  },
  getStoryListItems: (): StoryListItem[] => {
    const ids = readStoryIndex();
    if (ids.length > 0) {
      const list: StoryListItem[] = [];
      ids.forEach((storyId) => {
        const story = readStoryByIdFromSegmentedStorage(storyId);
        if (!story) return;
        list.push(toStoryListItem(story));
      });
      if (list.length > 0) return list;
    }
    return storage.getStories().map(toStoryListItem);
  },
  getStories: () => {
    const segmentedStories = readStoriesFromSegmentedStorage();
    if (segmentedStories.length > 0) return segmentedStories;

    const legacyData = getScopedRaw(STORIES_KEY);
    const legacyParsed = decodeStoriesPayload(legacyData);
    const legacyStories = Array.isArray(legacyParsed) ? legacyParsed.map(normalizeStory) : [];
    if (legacyStories.length > 0) {
      try {
        writeStoriesToSegmentedStorage(legacyStories);
      } catch {
        // If migration fails, continue using legacy in this session.
      }
    }
    return legacyStories;
  },
  getLatestStoriesBackup: () => {
    try {
      const raw = getScopedRaw(STORIES_BACKUP_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const history = Array.isArray(parsed) ? parsed : [];
      const latest = history[history.length - 1];
      return Array.isArray(latest?.stories) ? latest.stories.map(normalizeStory) : [];
    } catch {
      return [];
    }
  },
  saveStories: (stories: any[]) => {
    const previousStories = storage.getStories();
    const normalizedStories = withRevisionBumps(
      Array.isArray(stories) ? stories.map(normalizeStory) : [],
      previousStories,
    );
    const estimatedBytes = estimateUtf16Bytes(normalizedStories);
    if (estimatedBytes > STORIES_PAYLOAD_SOFT_LIMIT_BYTES) {
      failSaveWithNotice({
        section: 'stories',
        error: new Error('Estimated storage payload exceeds soft quota.'),
        estimatedBytes,
      });
    }
    try {
      writeStoriesToSegmentedStorage(normalizedStories);
    } catch (firstError) {
      try {
        setScopedRawGuarded(STORIES_BACKUP_HISTORY_KEY, JSON.stringify({
          schemaVersion: 2,
          entries: [],
        }), 'stories');
        writeStoriesToSegmentedStorage(normalizedStories);
      } catch (secondError) {
        failSaveWithNotice({
          section: 'stories',
          error: secondError || firstError,
          estimatedBytes,
        });
      }
    }
    backupStoriesSnapshot(normalizedStories);
    emitLocalWorkspaceChanged('stories');
  },
  getCharacters: () => safeParseArray(getScopedRaw(CHARACTERS_KEY)),
  saveCharacters: (characters: any[]) => {
    const payload = JSON.stringify(characters);
    setScopedRawGuarded(CHARACTERS_KEY, payload, 'characters');
    emitLocalWorkspaceChanged('characters');
  },
  getAIRules: () => safeParseArray(getScopedRaw(AI_RULES_KEY)),
  saveAIRules: (rules: any[]) => {
    const payload = JSON.stringify(rules);
    setScopedRawGuarded(AI_RULES_KEY, payload, 'ai_rules');
    emitLocalWorkspaceChanged('ai_rules');
  },
  getStyleReferences: () => safeParseArray(getScopedRaw(STYLE_REFERENCES_KEY)),
  saveStyleReferences: (refs: any[]) => {
    const payload = JSON.stringify(refs);
    setScopedRawGuarded(STYLE_REFERENCES_KEY, payload, 'style_references');
    emitLocalWorkspaceChanged('style_references');
  },
  getTranslationNames: () => safeParseArray(getScopedRaw(TRANSLATION_NAMES_KEY)),
  saveTranslationNames: (names: any[]) => {
    const payload = JSON.stringify(names);
    setScopedRawGuarded(TRANSLATION_NAMES_KEY, payload, 'translation_names');
    emitLocalWorkspaceChanged('translation_names');
  },
  getApiKeys: () => safeParseArray(getScopedRaw(API_KEYS_KEY)),
  saveApiKeys: (keys: any[]) => {
    setScopedRaw(API_KEYS_KEY, JSON.stringify(keys));
  },

  exportData: (): StorageExportReport => {
    const payload = buildBackupPayload();
    const filename = downloadBackupPayload(payload);
    return {
      filename,
      excludedSecrets: ['api_keys', 'api_runtime_config'],
    };
  },
  buildBackupPayload,
  downloadBackupPayload,

  importData: (jsonData: any): StorageImportReport => {
    if (!isPlainObject(jsonData)) {
      throw new Error('File backup khong hop le.');
    }

    const backupSnapshot = {
      exportedAt: new Date().toISOString(),
      stories: storage.getStories(),
      characters: storage.getCharacters(),
      ai_rules: storage.getAIRules(),
      style_references: storage.getStyleReferences(),
      translation_names: storage.getTranslationNames(),
      prompt_library: loadPromptLibraryState(),
      ui_profile: getScopedRaw(UI_PROFILE_KEY),
      ui_theme: getScopedRaw(UI_THEME_KEY),
      ui_viewport_mode: getScopedRaw(UI_VIEWPORT_MODE_KEY),
      reader_prefs: getScopedRaw(READER_PREFS_KEY),
      finops_budget: loadBudgetState(),
    };
    setScopedRaw(SAFE_IMPORT_BACKUP_KEY, JSON.stringify(backupSnapshot));

    const restoredSections: string[] = [];
    const skippedSections: string[] = [];

    if (Array.isArray(jsonData.stories)) {
      const nextStories = sanitizeImportStories(jsonData.stories);
      storage.saveStories(nextStories);
      restoredSections.push('stories');
    }
    if (Array.isArray(jsonData.characters)) {
      const nextCharacters = sanitizeImportObjectArray(jsonData.characters, IMPORT_MAX_CHARACTERS);
      storage.saveCharacters(nextCharacters);
      restoredSections.push('characters');
    }
    if (Array.isArray(jsonData.ai_rules)) {
      const nextRules = sanitizeImportObjectArray(jsonData.ai_rules, IMPORT_MAX_AI_RULES);
      storage.saveAIRules(nextRules);
      restoredSections.push('ai_rules');
    }
    if (Array.isArray(jsonData.style_references)) {
      const nextRefs = sanitizeImportObjectArray(jsonData.style_references, IMPORT_MAX_STYLE_REFERENCES);
      storage.saveStyleReferences(nextRefs);
      restoredSections.push('style_references');
    }
    if (Array.isArray(jsonData.translation_names)) {
      const nextNames = sanitizeImportObjectArray(jsonData.translation_names, IMPORT_MAX_TRANSLATION_NAMES);
      storage.saveTranslationNames(nextNames);
      restoredSections.push('translation_names');
    }
    if (isPlainObject(jsonData.prompt_library)) {
      savePromptLibraryState({
        core: Array.isArray(jsonData.prompt_library.core) ? jsonData.prompt_library.core.slice(0, IMPORT_MAX_PROMPT_ITEMS) : [],
        genre: Array.isArray(jsonData.prompt_library.genre) ? jsonData.prompt_library.genre.slice(0, IMPORT_MAX_PROMPT_ITEMS) : [],
        adult: Array.isArray(jsonData.prompt_library.adult) ? jsonData.prompt_library.adult.slice(0, IMPORT_MAX_PROMPT_ITEMS) : [],
      });
      restoredSections.push('prompt_library');
    }
    if (isPlainObject(jsonData.ui_profile)) {
      setScopedRaw(UI_PROFILE_KEY, JSON.stringify(jsonData.ui_profile));
      restoredSections.push('ui_profile');
    }
    if (typeof jsonData.ui_theme === 'string') {
      setScopedRaw(UI_THEME_KEY, jsonData.ui_theme);
      restoredSections.push('ui_theme');
    }
    if (typeof jsonData.ui_viewport_mode === 'string') {
      setScopedRaw(UI_VIEWPORT_MODE_KEY, jsonData.ui_viewport_mode);
      restoredSections.push('ui_viewport_mode');
    }
    if (isPlainObject(jsonData.reader_prefs)) {
      setScopedRaw(READER_PREFS_KEY, JSON.stringify(jsonData.reader_prefs));
      restoredSections.push('reader_prefs');
    }
    if (isPlainObject(jsonData.finops_budget)) {
      saveBudgetState(jsonData.finops_budget as unknown as BudgetState);
      restoredSections.push('finops_budget');
    }

    if ('api_keys' in jsonData) skippedSections.push('api_keys');
    if ('api_runtime_config' in jsonData) skippedSections.push('api_runtime_config');

    if (!restoredSections.length) {
      throw new Error('Backup khong chua du lieu hop le de khoi phuc.');
    }

    return { restoredSections, skippedSections };
  },
};
