export type SyncTaskType = 'save_draft' | 'comment_add' | 'tm_commit';
export type SyncTaskStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncTask {
  id: string;
  type: SyncTaskType;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  status: SyncTaskStatus;
  error?: string;
}

export interface SyncRunSummary {
  processed: number;
  failed: number;
  avgLatencyMs: number;
}

const SYNC_QUEUE_KEY = 'phase4_sync_queue_v1';
const SYNC_LOG_KEY = 'phase4_sync_log_v1';
const SYNC_LOG_LIMIT = 120;

function nowIso(): string {
  return new Date().toISOString();
}

function randomLatency(): number {
  return 180 + Math.floor(Math.random() * 640);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function loadSyncQueue(): SyncTask[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncTask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSyncQueue(queue: SyncTask[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function loadSyncLog(): Array<{ time: string; message: string }> {
  try {
    const raw = localStorage.getItem(SYNC_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ time: string; message: string }>;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendSyncLog(message: string): void {
  const next = [{ time: nowIso(), message }, ...loadSyncLog()].slice(0, SYNC_LOG_LIMIT);
  localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(next));
}

export function enqueueSyncTask(type: SyncTaskType, payload: Record<string, unknown>): SyncTask {
  const task: SyncTask = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    attempts: 0,
    status: 'pending',
  };
  const queue = loadSyncQueue();
  queue.unshift(task);
  saveSyncQueue(queue.slice(0, 500));
  appendSyncLog(`Queued task ${task.id} (${type})`);
  return task;
}

function updateTask(queue: SyncTask[], taskId: string, patch: Partial<SyncTask>): SyncTask[] {
  return queue.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...patch,
          updatedAt: nowIso(),
        }
      : task,
  );
}

async function simulateSync(task: SyncTask): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const latencyMs = randomLatency();
  await sleep(latencyMs);
  const randomFail = Math.random() < 0.08;
  if (randomFail) {
    return {
      ok: false,
      latencyMs,
      error: `Temporary network issue while syncing ${task.type}`,
    };
  }
  return { ok: true, latencyMs };
}

export async function flushSyncQueue(isOnline: boolean): Promise<SyncRunSummary> {
  const initial = loadSyncQueue();
  if (!initial.length) {
    return { processed: 0, failed: 0, avgLatencyMs: 0 };
  }
  if (!isOnline) {
    appendSyncLog('Skip flush: currently offline');
    return { processed: 0, failed: 0, avgLatencyMs: 0 };
  }

  let queue = initial;
  let processed = 0;
  let failed = 0;
  let totalLatency = 0;

  const pending = queue.filter((task) => task.status === 'pending' || task.status === 'failed').slice().reverse();
  for (const task of pending) {
    queue = updateTask(queue, task.id, {
      status: 'syncing',
      attempts: task.attempts + 1,
      error: '',
    });
    saveSyncQueue(queue);

    const outcome = await simulateSync(task);
    totalLatency += outcome.latencyMs;
    processed += 1;

    if (outcome.ok) {
      queue = updateTask(queue, task.id, {
        status: 'synced',
      });
      appendSyncLog(`Synced ${task.id} in ${outcome.latencyMs}ms`);
    } else {
      failed += 1;
      queue = updateTask(queue, task.id, {
        status: 'failed',
        error: outcome.error || 'Unknown error',
      });
      appendSyncLog(`Failed ${task.id}: ${outcome.error || 'Unknown error'}`);
    }
    saveSyncQueue(queue);
  }

  return {
    processed,
    failed,
    avgLatencyMs: processed ? Math.round(totalLatency / processed) : 0,
  };
}

