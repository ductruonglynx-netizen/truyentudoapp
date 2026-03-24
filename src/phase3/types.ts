export type WriterVariantMode = 'conservative' | 'balanced' | 'bold';
export type TonePreset = 'u-am' | 'lang-man' | 'gay-gon' | 'van-hoc';

export interface WriterVariant {
  mode: WriterVariantMode;
  text: string;
  confidence: number;
}

export interface PlotSuggestion {
  directions: string[];
  twists: string[];
  risks: string[];
}

export interface ToneShiftResult {
  rewritten: string;
  notes: string[];
}

export interface ContextReference {
  source: string;
  lineHint: string;
}

export interface ContextAnswer {
  answer: string;
  references: ContextReference[];
}

export interface WikiEntity {
  name: string;
  description: string;
  aliases: string[];
}

export interface TimelineHint {
  title: string;
  when: string;
  detail: string;
}

export interface WikiExtractionResult {
  characters: WikiEntity[];
  locations: WikiEntity[];
  items: WikiEntity[];
  timeline: TimelineHint[];
}

export interface WriterWorkspaceState {
  chapterObjective: string;
  styleProfile: string;
  recentChapterSummaries: string;
  timelineNotes: string;
  glossaryTerms: string;
  draftText: string;
  contextQuestion: string;
  wikiSource: string;
}

export interface UniverseWikiState {
  characters: WikiEntity[];
  locations: WikiEntity[];
  items: WikiEntity[];
  timeline: TimelineHint[];
  updatedAt: string;
}

