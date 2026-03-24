import React, { useState } from 'react';

export interface QaIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  problem: string;
  suggestion: string;
  quote?: string;
}

interface Props {
  onRun: (text: string) => Promise<QaIssue[]>;
}

export function QualityCenter({ onRun }: Props) {
  const [input, setInput] = useState('');
  const [issues, setIssues] = useState<QaIssue[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleRun = async () => {
    if (!input.trim()) {
      setMessage('Bạn chưa dán nội dung cần quét.');
      return;
    }
    setStatus('running');
    setMessage('Đang quét...');
    setIssues([]);
    try {
      const result = await onRun(input.trim());
      setIssues(result);
      setStatus('done');
      setMessage(result.length ? `Phát hiện ${result.length} vấn đề.` : 'Không phát hiện vấn đề nào.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Lỗi không xác định');
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Quality Center (beta) — Quét lỗi nhanh
        </p>
        <button
          onClick={handleRun}
          disabled={status === 'running'}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60"
        >
          {status === 'running' ? 'Đang quét...' : 'Quét lỗi'}
        </button>
      </div>
      <p className="text-xs text-indigo-800">Dán đoạn văn hoặc cả chương để quét chính tả, ngữ pháp, từ lặp, xưng hô.</p>
      <textarea
        className="w-full min-h-[120px] rounded-xl border border-indigo-200 px-3 py-2 text-sm"
        placeholder="Dán nội dung cần kiểm tra..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {message && (
        <div className={`text-xs ${status === 'error' ? 'text-rose-700' : 'text-indigo-800'}`}>
          {message}
        </div>
      )}
      <div className="space-y-2">
        {issues.map((issue) => (
          <div key={issue.id} className="rounded-xl border border-indigo-200 bg-white p-3 text-xs text-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{issue.problem || '(Không có mô tả)'}</span>
              <span
                className={`px-2 py-1 rounded-full text-[11px] font-bold ${
                  issue.severity === 'critical'
                    ? 'bg-red-200 text-red-800'
                    : issue.severity === 'high'
                    ? 'bg-rose-100 text-rose-700'
                    : issue.severity === 'low'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {issue.severity.toUpperCase()}
              </span>
            </div>
            {issue.quote && <p className="mt-1 italic text-slate-600">Trích: “{issue.quote}”</p>}
            {issue.suggestion && <p className="mt-1 text-slate-700">Gợi ý: {issue.suggestion}</p>}
          </div>
        ))}
        {status === 'done' && issues.length === 0 && (
          <p className="text-xs text-emerald-700">Không phát hiện vấn đề nào.</p>
        )}
      </div>
    </div>
  );
}
