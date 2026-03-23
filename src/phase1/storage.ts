import type {
  Phase1GlossaryEntry,
  Phase1ProjectState,
  Phase1TMSegment,
  SegmentStatus,
  SegmentTranslationRecord,
} from './types';

const STORAGE_KEY = 'phase1_translator_state_v2';

export const DEFAULT_SOURCE_DOCUMENT = [
  'Thanh Long truoc khi xuat chien da de lai mat lenh cho Ly Nhi.',
  'Co ay noi rang dem nay se co bien, khong duoc roi khoi thanh.',
  'Tieng trong canh gioi vang len, ca doanh trai lap tuc vao vi tri.',
].join('\n');

const defaultState: Phase1ProjectState = {
  sourceDocument: DEFAULT_SOURCE_DOCUMENT,
  tone: 'natural, literary',
  glossaryVersion: 1,
  glossary: [
    {
      id: 'g-1',
      source: 'Thanh Long',
      target: 'Rong Xanh',
      note: 'Keep this proper noun consistent.',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'g-2',
      source: 'Ly Nhi',
      target: 'Ly Nhi',
      note: 'Keep proper noun unchanged.',
      updatedAt: new Date().toISOString(),
    },
  ],
  tmSegments: [],
  translations: {},
};

export function loadPhase1State(): Phase1ProjectState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Phase1ProjectState;
    return {
      sourceDocument: parsed.sourceDocument || defaultState.sourceDocument,
      tone: parsed.tone || defaultState.tone,
      glossaryVersion: parsed.glossaryVersion || 1,
      glossary: parsed.glossary || [],
      tmSegments: parsed.tmSegments || [],
      translations: parsed.translations || {},
    };
  } catch {
    return defaultState;
  }
}

export function savePhase1State(state: Phase1ProjectState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function bumpGlossaryVersion(state: Phase1ProjectState): Phase1ProjectState {
  return {
    ...state,
    glossaryVersion: state.glossaryVersion + 1,
  };
}

export function upsertGlossaryEntry(
  state: Phase1ProjectState,
  entry: Omit<Phase1GlossaryEntry, 'updatedAt'>,
): Phase1ProjectState {
  const updatedEntry: Phase1GlossaryEntry = {
    ...entry,
    updatedAt: new Date().toISOString(),
  };

  const exists = state.glossary.some((row) => row.id === entry.id);
  const glossary = exists
    ? state.glossary.map((row) => (row.id === entry.id ? updatedEntry : row))
    : [updatedEntry, ...state.glossary];

  return bumpGlossaryVersion({
    ...state,
    glossary,
  });
}

export function deleteGlossaryEntry(state: Phase1ProjectState, id: string): Phase1ProjectState {
  return bumpGlossaryVersion({
    ...state,
    glossary: state.glossary.filter((row) => row.id !== id),
  });
}

export function addTmSegment(state: Phase1ProjectState, segment: Phase1TMSegment): Phase1ProjectState {
  const hasSame = state.tmSegments.some((s) => s.sourceHash === segment.sourceHash && s.target === segment.target);
  if (hasSame) return state;

  return {
    ...state,
    tmSegments: [segment, ...state.tmSegments].slice(0, 2000),
  };
}

export function setSegmentTranslation(
  state: Phase1ProjectState,
  segmentId: string,
  text: string,
  provider: string,
  status: SegmentStatus = 'translated',
): Phase1ProjectState {
  const current = state.translations[segmentId];
  const record: SegmentTranslationRecord = {
    text,
    provider,
    status,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...state,
    translations: {
      ...state.translations,
      [segmentId]: {
        ...current,
        ...record,
      },
    },
  };
}

export function setSegmentStatus(
  state: Phase1ProjectState,
  segmentId: string,
  status: SegmentStatus,
): Phase1ProjectState {
  const existing = state.translations[segmentId];
  if (!existing) return state;

  return {
    ...state,
    translations: {
      ...state.translations,
      [segmentId]: {
        ...existing,
        status,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

export function resetPhase1State(): void {
  localStorage.removeItem(STORAGE_KEY);
}
