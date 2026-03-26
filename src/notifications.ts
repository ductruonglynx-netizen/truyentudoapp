export type AppNoticeTone = 'info' | 'success' | 'warn' | 'error';

export interface AppNoticePayload {
  id?: string;
  title?: string;
  message: string;
  detail?: string;
  tone?: AppNoticeTone;
  timeoutMs?: number;
  groupKey?: string;
  persist?: boolean;
}

export const APP_NOTICE_EVENT = 'truyenforge:notice';

export function notifyApp(payload: AppNoticePayload | string): void {
  if (typeof window === 'undefined') return;
  const normalized: AppNoticePayload = typeof payload === 'string'
    ? { message: payload }
    : payload;
  window.dispatchEvent(new CustomEvent<AppNoticePayload>(APP_NOTICE_EVENT, {
    detail: {
      id: normalized.id || `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: String(normalized.title || '').trim() || undefined,
      tone: normalized.tone || 'info',
      timeoutMs: normalized.timeoutMs ?? 3800,
      message: String(normalized.message || '').trim(),
      detail: String(normalized.detail || '').trim() || undefined,
      groupKey: String(normalized.groupKey || '').trim() || undefined,
      persist: Boolean(normalized.persist),
    },
  }));
}
