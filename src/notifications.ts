export type AppNoticeTone = 'info' | 'success' | 'warn' | 'error';

export interface AppNoticePayload {
  id?: string;
  message: string;
  tone?: AppNoticeTone;
  timeoutMs?: number;
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
      tone: normalized.tone || 'info',
      timeoutMs: normalized.timeoutMs ?? 3800,
      message: String(normalized.message || '').trim(),
    },
  }));
}
