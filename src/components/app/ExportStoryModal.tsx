import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ExportFormat = 'txt' | 'epub';

interface ExportStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  format: ExportFormat;
  onFormatChange: (f: ExportFormat) => void;
  includeToc: boolean;
  onToggleToc: (v: boolean) => void;
  onConfirm: () => void;
  busy: boolean;
  storyTitle: string;
}

export function ExportStoryModal({
  isOpen,
  onClose,
  format,
  onFormatChange,
  includeToc,
  onToggleToc,
  onConfirm,
  busy,
  storyTitle,
}: ExportStoryModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[220] tf-modal-overlay flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="tf-modal-panel bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Xuất truyện</p>
            <h3 className="text-2xl font-serif font-bold text-slate-900 tf-break-long">{storyTitle || 'Truyện'}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="tf-modal-content p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Định dạng</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['txt', 'epub'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onFormatChange(fmt)}
                  className={cn(
                    'px-4 py-3 rounded-2xl border text-sm font-bold transition-all',
                    format === fmt
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200',
                  )}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={includeToc}
              onChange={(e) => onToggleToc(e.target.checked)}
            />
            <span className="text-sm text-slate-600">Bao gồm mục lục (nhảy đến chương)</span>
          </label>
          <p className="text-xs text-slate-400">EPUB sẽ tạo nav.xhtml với liên kết tới từng chương. TXT sẽ chèn mục lục dạng danh sách.</p>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 tf-modal-actions">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border text-sm font-bold text-slate-600 hover:bg-slate-100">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Đang xuất...' : 'Tải xuống'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
