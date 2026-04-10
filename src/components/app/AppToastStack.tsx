import React from 'react';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AppNoticeTone } from '../../notifications';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppToastItem {
  id: string;
  groupKey: string;
  title?: string;
  message: string;
  detail?: string;
  tone: AppNoticeTone;
  count: number;
}

interface AppToastStackProps {
  toasts: AppToastItem[];
  onDismiss: (groupKey: string) => void;
}

export function AppToastStack({ toasts, onDismiss }: AppToastStackProps) {
  if (!toasts.length) return null;
  return (
    <div className="app-toast-stack fixed right-4 top-24 z-[260] flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-2xl border px-4 py-3 shadow-xl backdrop-blur',
            toast.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
            toast.tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-800',
            toast.tone === 'error' && 'border-rose-200 bg-rose-50 text-rose-800',
            toast.tone === 'info' && 'border-indigo-200 bg-white text-slate-800',
          )}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-70">
                  {toast.title || (toast.tone === 'success'
                    ? 'Thành công'
                    : toast.tone === 'warn'
                      ? 'Lưu ý'
                      : toast.tone === 'error'
                        ? 'Lỗi'
                        : 'Thông tin')}
                </p>
                {toast.count > 1 ? (
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold">
                    x{toast.count}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-semibold leading-6">{toast.message}</p>
              {toast.detail ? (
                <p className="mt-1 text-xs leading-5 opacity-80">{toast.detail}</p>
              ) : null}
            </div>
            <button
              onClick={() => onDismiss(toast.groupKey)}
              className="rounded-full p-1.5 text-current/60 transition hover:bg-black/5 hover:text-current"
              aria-label="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
