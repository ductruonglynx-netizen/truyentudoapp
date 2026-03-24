import type { UniverseWikiState, WriterWorkspaceState } from './types';

const WRITER_STATE_KEY = 'phase3_writer_workspace_v1';
const WIKI_STATE_KEY = 'phase3_universe_wiki_v1';

const defaultWorkspaceState: WriterWorkspaceState = {
  chapterObjective: '',
  styleProfile: 'Viet theo van phong dien anh, nhieu hinh anh, nhip do tu nhien.',
  recentChapterSummaries: '',
  timelineNotes: '',
  glossaryTerms: '',
  draftText: '',
  contextQuestion: '',
  wikiSource: '',
};

const defaultWikiState: UniverseWikiState = {
  characters: [],
  locations: [],
  items: [],
  timeline: [],
  updatedAt: new Date(0).toISOString(),
};

export function loadWriterWorkspaceState(): WriterWorkspaceState {
  try {
    const raw = localStorage.getItem(WRITER_STATE_KEY);
    if (!raw) return defaultWorkspaceState;
    const parsed = JSON.parse(raw) as Partial<WriterWorkspaceState>;
    return {
      chapterObjective: parsed.chapterObjective || defaultWorkspaceState.chapterObjective,
      styleProfile: parsed.styleProfile || defaultWorkspaceState.styleProfile,
      recentChapterSummaries: parsed.recentChapterSummaries || defaultWorkspaceState.recentChapterSummaries,
      timelineNotes: parsed.timelineNotes || defaultWorkspaceState.timelineNotes,
      glossaryTerms: parsed.glossaryTerms || defaultWorkspaceState.glossaryTerms,
      draftText: parsed.draftText || defaultWorkspaceState.draftText,
      contextQuestion: parsed.contextQuestion || defaultWorkspaceState.contextQuestion,
      wikiSource: parsed.wikiSource || defaultWorkspaceState.wikiSource,
    };
  } catch {
    return defaultWorkspaceState;
  }
}

export function saveWriterWorkspaceState(state: WriterWorkspaceState): void {
  localStorage.setItem(WRITER_STATE_KEY, JSON.stringify(state));
}

export function loadUniverseWikiState(): UniverseWikiState {
  try {
    const raw = localStorage.getItem(WIKI_STATE_KEY);
    if (!raw) return defaultWikiState;
    const parsed = JSON.parse(raw) as Partial<UniverseWikiState>;
    return {
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
      updatedAt: parsed.updatedAt || defaultWikiState.updatedAt,
    };
  } catch {
    return defaultWikiState;
  }
}

export function saveUniverseWikiState(state: UniverseWikiState): void {
  localStorage.setItem(WIKI_STATE_KEY, JSON.stringify(state));
}

