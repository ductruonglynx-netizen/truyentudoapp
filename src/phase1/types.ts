export type SegmentStatus = 'pending' | 'translated' | 'reviewed';

export interface Phase1GlossaryEntry {
  id: string;
  source: string;
  target: string;
  note?: string;
  updatedAt: string;
}

export interface Phase1TMSegment {
  id: string;
  source: string;
  target: string;
  sourceHash: string;
  createdAt: string;
}

export interface SegmentTranslationRecord {
  text: string;
  status: SegmentStatus;
  provider: string;
  updatedAt: string;
}

export interface Phase1ProjectState {
  sourceDocument: string;
  tone: string;
  glossaryVersion: number;
  glossary: Phase1GlossaryEntry[];
  tmSegments: Phase1TMSegment[];
  translations: Record<string, SegmentTranslationRecord>;
}

export interface TmMatch {
  tmId: string;
  source: string;
  target: string;
  score: number;
  matchType: 'exact' | 'fuzzy';
}

export interface SegmentSuggestion {
  text: string;
  violations: string[];
  provider: string;
}
