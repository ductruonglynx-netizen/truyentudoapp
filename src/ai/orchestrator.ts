import type { AiTaskStage, AiTaskTrace, AiTaskType } from './types';

const AI_ORCHESTRATOR_LOG_KEY = 'truyenforge:ai-orchestrator:runs:v1';
const AI_ORCHESTRATOR_MAX_LOGS = 180;

interface AiOrchestratorLog {
  runId: string;
  task: AiTaskType;
  stage: AiTaskStage;
  promptVersion: string;
  status: 'start' | 'stage' | 'success' | 'error';
  ts: string;
  elapsedMs: number;
  details: Record<string, unknown>;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function buildRunId(task: AiTaskType): string {
  return `${task}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readLogs(): AiOrchestratorLog[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(AI_ORCHESTRATOR_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AiOrchestratorLog[]) : [];
  } catch {
    return [];
  }
}

function writeLogs(logs: AiOrchestratorLog[]): void {
  if (!canUseStorage()) return;
  const trimmed = logs.slice(-AI_ORCHESTRATOR_MAX_LOGS);
  localStorage.setItem(AI_ORCHESTRATOR_LOG_KEY, JSON.stringify(trimmed));
}

function appendLog(log: AiOrchestratorLog): void {
  const logs = readLogs();
  logs.push(log);
  writeLogs(logs);
}

export function startAiTaskRun(task: AiTaskType, promptVersion: string, details?: Record<string, unknown>) {
  const startedAt = Date.now();
  const runId = buildRunId(task);
  appendLog({
    runId,
    task,
    stage: 'prepare',
    promptVersion,
    status: 'start',
    ts: new Date(startedAt).toISOString(),
    elapsedMs: 0,
    details: details || {},
  });

  const traceFor = (stage: AiTaskStage): AiTaskTrace => ({
    task,
    stage,
    promptVersion,
    runId,
  });

  return {
    runId,
    task,
    promptVersion,
    traceFor,
    markStage(stage: AiTaskStage, meta?: Record<string, unknown>) {
      appendLog({
        runId,
        task,
        stage,
        promptVersion,
        status: 'stage',
        ts: new Date().toISOString(),
        elapsedMs: Date.now() - startedAt,
        details: meta || {},
      });
    },
    complete(meta?: Record<string, unknown>) {
      appendLog({
        runId,
        task,
        stage: 'finalize',
        promptVersion,
        status: 'success',
        ts: new Date().toISOString(),
        elapsedMs: Date.now() - startedAt,
        details: meta || {},
      });
    },
    fail(error: unknown, meta?: Record<string, unknown>) {
      appendLog({
        runId,
        task,
        stage: 'finalize',
        promptVersion,
        status: 'error',
        ts: new Date().toISOString(),
        elapsedMs: Date.now() - startedAt,
        details: {
          error: error instanceof Error ? error.message : String(error || ''),
          ...(meta || {}),
        },
      });
    },
  };
}

export function readAiTaskRunLogs(): unknown[] {
  return readLogs();
}
