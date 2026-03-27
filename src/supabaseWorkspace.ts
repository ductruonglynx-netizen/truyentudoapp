import { hasSupabase, supabase } from './supabaseClient';

const WORKSPACES_TABLE = (import.meta.env.VITE_SUPABASE_WORKSPACES_TABLE || 'user_workspaces').trim();
const QA_REPORTS_TABLE = (import.meta.env.VITE_SUPABASE_QA_REPORTS_TABLE || 'qa_reports').trim();

function toIsoString(value: unknown): string {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return value;
  }
  return new Date().toISOString();
}

function requireSupabase() {
  if (!hasSupabase || !supabase) {
    throw new Error('Supabase chưa được cấu hình đầy đủ.');
  }
  return supabase;
}

export function hasServerWorkspaceStorage(): boolean {
  return hasSupabase && Boolean(supabase);
}

export async function loadServerWorkspace<T>(userId: string): Promise<{ payload: T | null; updatedAt: string | null }> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(WORKSPACES_TABLE)
    .select('payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    payload: (data?.payload as T | null) || null,
    updatedAt: data?.updated_at ? toIsoString(data.updated_at) : null,
  };
}

export async function saveServerWorkspace<T extends { updatedAt?: string }>(userId: string, payload: T): Promise<void> {
  const client = requireSupabase();
  const updatedAt = toIsoString(payload?.updatedAt);
  const { error } = await client
    .from(WORKSPACES_TABLE)
    .upsert(
      {
        user_id: userId,
        payload,
        updated_at: updatedAt,
      },
      { onConflict: 'user_id' },
    );

  if (error) throw error;
}

export async function saveQaReport(userId: string, report: {
  textPreview: string;
  issueCount: number;
  issues: unknown[];
  createdAt?: string;
}): Promise<void> {
  if (!hasServerWorkspaceStorage()) return;
  const client = requireSupabase();
  const createdAt = toIsoString(report.createdAt);
  const { error } = await client
    .from(QA_REPORTS_TABLE)
    .insert({
      author_id: userId,
      text_preview: report.textPreview,
      issue_count: report.issueCount,
      payload: {
        issues: report.issues,
      },
      created_at: createdAt,
    });

  if (error) throw error;
}

export const SUPABASE_STORAGE_TABLES = {
  workspaces: WORKSPACES_TABLE,
  qaReports: QA_REPORTS_TABLE,
};
