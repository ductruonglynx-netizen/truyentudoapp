import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Cloud,
  CloudOff,
  MessageSquare,
  RefreshCw,
  Send,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { getUsageSnapshot } from '../phase0/aiGateway';
import { registerPhase4ServiceWorker } from './pwa';
import {
  appendSyncLog,
  enqueueSyncTask,
  flushSyncQueue,
  loadSyncLog,
  loadSyncQueue,
  saveSyncQueue,
  type SyncTask,
} from './syncQueue';

interface TeamComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  status: 'pending' | 'synced' | 'failed';
}

const DRAFT_KEY = 'phase4_offline_draft_v1';
const COMMENTS_KEY = 'phase4_comments_v1';
const QUOTA_TOKENS_LIMIT = 120000;

function loadComments(): TeamComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TeamComment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveComments(comments: TeamComment[]): void {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments.slice(0, 500)));
}

export default function Phase4App() {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [draftText, setDraftText] = useState<string>(() => localStorage.getItem(DRAFT_KEY) || '');
  const [queue, setQueue] = useState<SyncTask[]>(() => loadSyncQueue());
  const [logs, setLogs] = useState<Array<{ time: string; message: string }>>(() => loadSyncLog());
  const [comments, setComments] = useState<TeamComment[]>(() => loadComments());
  const [commentInput, setCommentInput] = useState('');
  const [syncRunning, setSyncRunning] = useState(false);
  const syncRunningRef = useRef(false);
  const [swMessage, setSwMessage] = useState('Initializing PWA shell...');
  const [lastSummary, setLastSummary] = useState({ processed: 0, failed: 0, avgLatencyMs: 0 });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, draftText);
  }, [draftText]);

  useEffect(() => {
    saveComments(comments);
  }, [comments]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (!navigator.onLine) return;
      if (syncRunningRef.current) return;
      await runFlush();
    }, 18000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    syncRunningRef.current = syncRunning;
  }, [syncRunning]);

  useEffect(() => {
    const run = async () => {
      const sw = await registerPhase4ServiceWorker();
      setSwMessage(sw.message);
    };
    run();
  }, []);

  const refreshQueueAndLogs = () => {
    const q = loadSyncQueue();
    setQueue(q);
    setLogs(loadSyncLog());
    setComments((prev) =>
      prev.map((comment) => {
        const linkedTask = q.find((item) => String(item.payload.commentId || '') === comment.id);
        if (!linkedTask) return comment;
        if (linkedTask.status === 'synced') return { ...comment, status: 'synced' };
        if (linkedTask.status === 'failed') return { ...comment, status: 'failed' };
        return { ...comment, status: 'pending' };
      }),
    );
  };

  const runFlush = async () => {
    setSyncRunning(true);
    try {
      const summary = await flushSyncQueue(navigator.onLine);
      setLastSummary(summary);
      refreshQueueAndLogs();
    } finally {
      setSyncRunning(false);
    }
  };

  const queueDraftSave = () => {
    enqueueSyncTask('save_draft', {
      draftId: 'draft-main',
      text: draftText,
      savedAt: new Date().toISOString(),
    });
    appendSyncLog('Queued offline draft sync');
    refreshQueueAndLogs();
  };

  const queueComment = () => {
    const text = commentInput.trim();
    if (!text) return;
    const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const comment: TeamComment = {
      id,
      author: 'Local Editor',
      text,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setComments((prev) => [comment, ...prev]);
    enqueueSyncTask('comment_add', {
      commentId: id,
      text,
      author: comment.author,
      createdAt: comment.createdAt,
    });
    setCommentInput('');
    refreshQueueAndLogs();
  };

  const clearSyncedQueueItems = () => {
    const next = loadSyncQueue().filter((item) => item.status !== 'synced');
    saveSyncQueue(next);
    appendSyncLog('Cleared synced queue items');
    refreshQueueAndLogs();
  };

  const usage = getUsageSnapshot();
  const usedTokens = usage.estimatedTokens || 0;
  const quotaPct = Math.min(100, Math.round((usedTokens / QUOTA_TOKENS_LIMIT) * 100));

  const queueStats = useMemo(() => {
    const pending = queue.filter((item) => item.status === 'pending' || item.status === 'syncing').length;
    const failed = queue.filter((item) => item.status === 'failed').length;
    const synced = queue.filter((item) => item.status === 'synced').length;
    return { pending, failed, synced };
  }, [queue]);

  return (
    <div className="min-h-screen bg-[#F6F7F4] text-[#1F2933] p-4 md:p-6">
      <div className="mx-auto max-w-[1480px] space-y-4">
        <header className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#52606D]">Phase 4 - Scale & PWA</p>
              <h1 className="font-serif text-2xl font-bold">Offline Drafting · Sync Queue · Team Comments · Quota Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${isOnline ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>
                {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#D9E2EC] bg-[#DFF6F4] px-3 py-1 text-[#0F766E]">
                <Cloud className="h-3.5 w-3.5" />
                {swMessage}
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <main className="rounded-2xl border border-[#D9E2EC] bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#52606D]">Offline Draft Workspace</h2>
              <div className="flex gap-2">
                <button
                  onClick={queueDraftSave}
                  className="rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {isOnline ? <Cloud className="mr-1 inline-block h-4 w-4" /> : <CloudOff className="mr-1 inline-block h-4 w-4" />}
                  Queue Save
                </button>
                <button
                  onClick={runFlush}
                  disabled={syncRunning}
                  className="rounded-lg border border-[#D9E2EC] px-3 py-1.5 text-xs font-semibold disabled:opacity-70"
                >
                  {syncRunning ? <LoaderView /> : <RefreshCw className="mr-1 inline-block h-4 w-4" />}
                  Sync now
                </button>
              </div>
            </div>
            <textarea
              className="w-full rounded-xl border border-[#D9E2EC] p-3 text-sm min-h-[280px]"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Write while offline. Every save can be queued and synced later."
            />
            <div className="rounded-xl border border-[#D9E2EC] bg-[#F6F7F4] p-3 text-xs text-[#52606D]">
              <p>Last sync run: processed {lastSummary.processed} items · failed {lastSummary.failed} · avg {lastSummary.avgLatencyMs} ms</p>
            </div>
          </main>

          <aside className="rounded-2xl border border-[#D9E2EC] bg-white p-4 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#52606D]">Team Comments</h2>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-[#D9E2EC] px-2 py-1 text-sm"
                placeholder="Add collaboration note..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <button
                onClick={queueComment}
                className="rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-[#D9E2EC] bg-[#F6F7F4] p-2 text-xs">
                  <p className="font-semibold">{comment.author}</p>
                  <p className="mt-1 text-sm">{comment.text}</p>
                  <p className="mt-1 text-[11px] text-[#52606D]">{new Date(comment.createdAt).toLocaleString()}</p>
                  <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    comment.status === 'synced'
                      ? 'bg-emerald-100 text-emerald-700'
                      : comment.status === 'failed'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {comment.status}
                  </p>
                </div>
              ))}
              {!comments.length && <p className="text-xs text-[#52606D]">No comments yet.</p>}
            </div>
          </aside>

          <aside className="rounded-2xl border border-[#D9E2EC] bg-white p-4 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#52606D]">Quota & Observability</h2>
            <div className="rounded-xl border border-[#D9E2EC] bg-[#F6F7F4] p-3 text-xs space-y-1">
              <p className="inline-flex items-center gap-1 font-semibold text-[#1F2933]"><Wallet className="h-4 w-4" /> Token quota</p>
              <p>{usedTokens} / {QUOTA_TOKENS_LIMIT} tokens ({quotaPct}%)</p>
              <div className="h-2 rounded-full bg-white border border-[#D9E2EC] overflow-hidden">
                <div
                  className={`h-full ${quotaPct >= 90 ? 'bg-[#B91C1C]' : quotaPct >= 70 ? 'bg-[#B45309]' : 'bg-[#2F855A]'}`}
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[#D9E2EC] bg-[#F6F7F4] p-3 text-xs space-y-1">
              <p className="inline-flex items-center gap-1 font-semibold text-[#1F2933]"><Activity className="h-4 w-4" /> Queue health</p>
              <p>Pending/syncing: {queueStats.pending}</p>
              <p>Failed: {queueStats.failed}</p>
              <p>Synced: {queueStats.synced}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshQueueAndLogs}
                className="flex-1 rounded-lg border border-[#D9E2EC] px-2 py-1.5 text-xs font-semibold"
              >
                <RefreshCw className="mr-1 inline-block h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={clearSyncedQueueItems}
                className="flex-1 rounded-lg border border-[#D9E2EC] px-2 py-1.5 text-xs font-semibold"
              >
                Clear Synced
              </button>
            </div>
            <div className="rounded-xl border border-[#D9E2EC] bg-[#F6F7F4] p-3 max-h-[260px] overflow-y-auto text-xs">
              <p className="mb-1 inline-flex items-center gap-1 font-semibold text-[#1F2933]"><MessageSquare className="h-4 w-4" /> Sync logs</p>
              {logs.map((log, idx) => (
                <p key={`${log.time}-${idx}`} className="mb-1">
                  [{new Date(log.time).toLocaleTimeString()}] {log.message}
                </p>
              ))}
              {!logs.length && <p>No logs yet.</p>}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function LoaderView() {
  return <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#0F766E] border-t-transparent" />;
}
