export type WebGpuWeekOneTaskStatus = 'todo' | 'in_progress' | 'done';

export interface WebGpuWeekOneTask {
  id: string;
  title: string;
  description: string;
  status: WebGpuWeekOneTaskStatus;
  updatedAt: string;
}

export type WebGpuCapabilityStatus =
  | 'ready'
  | 'flag_disabled'
  | 'insecure_context'
  | 'unsupported'
  | 'adapter_unavailable'
  | 'error';

export interface WebGpuCapabilityReport {
  status: WebGpuCapabilityStatus;
  summary: string;
  checkedAt: string;
  flagEnabled: boolean;
  secureContext: boolean;
  hasNavigatorGpu: boolean;
  adapterName?: string;
  adapterFallback?: boolean;
  maxBufferSize?: number;
  maxStorageBufferBindingSize?: number;
  errorMessage?: string;
}

export interface WebGpuStabilityReport {
  success: boolean;
  checkedAt: string;
  iterationsRequested: number;
  iterationsCompleted: number;
  durationMs: number;
  avgIterationMs: number;
  throughputOpsPerSecond: number;
  deviceLost: boolean;
  message: string;
  errorMessage?: string;
}

export interface WebGpuWeekOneState {
  updatedAt: string;
  tasks: WebGpuWeekOneTask[];
  capability: WebGpuCapabilityReport | null;
  stability: WebGpuStabilityReport | null;
}

const WEBGPU_WEEK_ONE_STORAGE_KEY = 'truyenforge:webgpu:week1:v1';

const DEFAULT_TASKS: Array<Pick<WebGpuWeekOneTask, 'id' | 'title' | 'description'>> = [
  {
    id: 'scope',
    title: 'Chốt use-case WebGPU',
    description: 'Xác định rõ tính năng nào chạy WebGPU trong bản đầu (ảnh bìa, compute, render).',
  },
  {
    id: 'kpi',
    title: 'Đặt KPI hiệu năng',
    description: 'Chốt mục tiêu đo được: latency, FPS, thời gian warmup, tỷ lệ fallback.',
  },
  {
    id: 'feature-flag',
    title: 'Khóa bằng feature flag',
    description: 'Bật/tắt WebGPU qua biến môi trường để rollout an toàn theo từng pha.',
  },
  {
    id: 'stability',
    title: 'Thiết lập smoke test ổn định',
    description: 'Có bài test nhanh để kiểm tra adapter/device/queue trước khi bật rộng.',
  },
];

function readWebGpuEnv(name: 'VITE_ENABLE_WEBGPU' | 'VITE_WEBGPU_STABILITY_ITERATIONS', fallback = ''): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const raw = String(env?.[name] ?? fallback).trim();
  return raw;
}

export function isWebGpuFeatureEnabled(): boolean {
  const raw = readWebGpuEnv('VITE_ENABLE_WEBGPU', '0').toLowerCase();
  if (!raw) return false;
  return raw !== '0' && raw !== 'false' && raw !== 'off' && raw !== 'no';
}

export function getWebGpuWeekOneDefaultIterations(): number {
  const parsed = Number(readWebGpuEnv('VITE_WEBGPU_STABILITY_ITERATIONS', '90'));
  if (!Number.isFinite(parsed)) return 90;
  return Math.max(20, Math.min(500, Math.round(parsed)));
}

function isoNow(): string {
  return new Date().toISOString();
}

function createDefaultTasks(): WebGpuWeekOneTask[] {
  const now = isoNow();
  return DEFAULT_TASKS.map((item) => ({
    ...item,
    status: 'todo',
    updatedAt: now,
  }));
}

function createDefaultState(): WebGpuWeekOneState {
  return {
    updatedAt: isoNow(),
    tasks: createDefaultTasks(),
    capability: null,
    stability: null,
  };
}

function normalizeTaskStatus(value: unknown): WebGpuWeekOneTaskStatus {
  if (value === 'done' || value === 'in_progress') return value;
  return 'todo';
}

export function loadWebGpuWeekOneState(): WebGpuWeekOneState {
  if (typeof window === 'undefined') return createDefaultState();
  try {
    const raw = localStorage.getItem(WEBGPU_WEEK_ONE_STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<WebGpuWeekOneState> | null;
    const byId = new Map<string, WebGpuWeekOneTask>();
    (Array.isArray(parsed?.tasks) ? parsed?.tasks : []).forEach((task) => {
      if (!task || typeof task !== 'object') return;
      const id = String((task as WebGpuWeekOneTask).id || '').trim();
      if (!id) return;
      byId.set(id, {
        id,
        title: String((task as WebGpuWeekOneTask).title || '').trim() || id,
        description: String((task as WebGpuWeekOneTask).description || '').trim(),
        status: normalizeTaskStatus((task as WebGpuWeekOneTask).status),
        updatedAt: String((task as WebGpuWeekOneTask).updatedAt || '').trim() || isoNow(),
      });
    });
    const tasks = DEFAULT_TASKS.map((seed) => {
      const existing = byId.get(seed.id);
      if (!existing) {
        return {
          ...seed,
          status: 'todo' as const,
          updatedAt: isoNow(),
        };
      }
      return {
        ...existing,
        title: existing.title || seed.title,
        description: existing.description || seed.description,
      };
    });
    return {
      updatedAt: String(parsed?.updatedAt || '').trim() || isoNow(),
      tasks,
      capability: parsed?.capability && typeof parsed.capability === 'object'
        ? (parsed.capability as WebGpuCapabilityReport)
        : null,
      stability: parsed?.stability && typeof parsed.stability === 'object'
        ? (parsed.stability as WebGpuStabilityReport)
        : null,
    };
  } catch {
    return createDefaultState();
  }
}

export function saveWebGpuWeekOneState(state: WebGpuWeekOneState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WEBGPU_WEEK_ONE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors.
  }
}

export function updateWebGpuWeekOneTaskStatus(
  state: WebGpuWeekOneState,
  taskId: string,
  status: WebGpuWeekOneTaskStatus,
): WebGpuWeekOneState {
  const normalizedTaskId = String(taskId || '').trim();
  if (!normalizedTaskId) return state;
  const now = isoNow();
  return {
    ...state,
    updatedAt: now,
    tasks: state.tasks.map((task) => (
      task.id === normalizedTaskId
        ? { ...task, status, updatedAt: now }
        : task
    )),
  };
}

export function countWebGpuWeekOneCompletedTasks(state: WebGpuWeekOneState): number {
  return state.tasks.filter((task) => task.status === 'done').length;
}

function getNavigatorGpu(): any {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & { gpu?: any }).gpu || null;
}

async function resolveAdapterInfo(adapter: any): Promise<{ name?: string; fallback?: boolean }> {
  if (!adapter) return {};
  let adapterName = '';
  try {
    const info = typeof adapter.requestAdapterInfo === 'function'
      ? await adapter.requestAdapterInfo()
      : null;
    adapterName = String(info?.description || info?.vendor || '').trim();
  } catch {
    adapterName = '';
  }
  const fallback = Boolean(adapter.isFallbackAdapter);
  return {
    name: adapterName || undefined,
    fallback,
  };
}

export async function runWebGpuCapabilityCheck(): Promise<WebGpuCapabilityReport> {
  const flagEnabled = isWebGpuFeatureEnabled();
  const secureContext = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
  const gpu = getNavigatorGpu();
  const hasNavigatorGpu = Boolean(gpu);

  if (!flagEnabled) {
    return {
      status: 'flag_disabled',
      summary: 'Feature flag WebGPU đang tắt.',
      checkedAt: isoNow(),
      flagEnabled,
      secureContext,
      hasNavigatorGpu,
    };
  }

  if (!secureContext) {
    return {
      status: 'insecure_context',
      summary: 'WebGPU yêu cầu HTTPS hoặc localhost secure context.',
      checkedAt: isoNow(),
      flagEnabled,
      secureContext,
      hasNavigatorGpu,
    };
  }

  if (!gpu) {
    return {
      status: 'unsupported',
      summary: 'Trình duyệt/thiết bị chưa hỗ trợ navigator.gpu.',
      checkedAt: isoNow(),
      flagEnabled,
      secureContext,
      hasNavigatorGpu,
    };
  }

  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return {
        status: 'adapter_unavailable',
        summary: 'Không lấy được GPU adapter hợp lệ.',
        checkedAt: isoNow(),
        flagEnabled,
        secureContext,
        hasNavigatorGpu,
      };
    }
    const info = await resolveAdapterInfo(adapter);
    const limits = adapter?.limits || {};
    return {
      status: 'ready',
      summary: info.name
        ? `Sẵn sàng chạy WebGPU trên adapter: ${info.name}.`
        : 'Sẵn sàng chạy WebGPU trên thiết bị hiện tại.',
      checkedAt: isoNow(),
      flagEnabled,
      secureContext,
      hasNavigatorGpu,
      adapterName: info.name,
      adapterFallback: info.fallback,
      maxBufferSize: Number(limits.maxBufferSize || 0),
      maxStorageBufferBindingSize: Number(limits.maxStorageBufferBindingSize || 0),
    };
  } catch (error) {
    return {
      status: 'error',
      summary: 'Lỗi khi kiểm tra khả năng WebGPU.',
      checkedAt: isoNow(),
      flagEnabled,
      secureContext,
      hasNavigatorGpu,
      errorMessage: error instanceof Error ? error.message : String(error || 'Unknown error'),
    };
  }
}

async function waitForQueueIdle(device: any): Promise<void> {
  if (device?.queue && typeof device.queue.onSubmittedWorkDone === 'function') {
    await device.queue.onSubmittedWorkDone();
    return;
  }
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

export async function runWebGpuStabilityCheck(iterationsInput?: number): Promise<WebGpuStabilityReport> {
  const iterations = Math.max(20, Math.min(500, Math.round(Number(iterationsInput || getWebGpuWeekOneDefaultIterations()) || 90)));
  const capability = await runWebGpuCapabilityCheck();
  if (capability.status !== 'ready') {
    return {
      success: false,
      checkedAt: isoNow(),
      iterationsRequested: iterations,
      iterationsCompleted: 0,
      durationMs: 0,
      avgIterationMs: 0,
      throughputOpsPerSecond: 0,
      deviceLost: false,
      message: `Không chạy được stability test: ${capability.summary}`,
      errorMessage: capability.errorMessage,
    };
  }

  const gpu = getNavigatorGpu();
  if (!gpu) {
    return {
      success: false,
      checkedAt: isoNow(),
      iterationsRequested: iterations,
      iterationsCompleted: 0,
      durationMs: 0,
      avgIterationMs: 0,
      throughputOpsPerSecond: 0,
      deviceLost: false,
      message: 'Không tìm thấy navigator.gpu khi chạy stability test.',
    };
  }

  const startedAtMs = Date.now();
  let iterationsCompleted = 0;
  let deviceLost = false;
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error('GPU adapter unavailable.');
    const device = await adapter.requestDevice();
    const lostPromise = device?.lost?.then((info: any) => {
      deviceLost = true;
      return info;
    });

    const usage = (globalThis as any).GPUBufferUsage;
    const mapMode = (globalThis as any).GPUMapMode;
    if (!usage || !mapMode) {
      throw new Error('GPUBufferUsage/GPUMapMode chưa khả dụng trong runtime.');
    }

    const itemCount = 512;
    const byteSize = itemCount * 4;
    const source = device.createBuffer({
      size: byteSize,
      usage: usage.COPY_SRC | usage.COPY_DST,
      mappedAtCreation: true,
    });
    const initView = new Uint32Array(source.getMappedRange());
    initView.fill(7);
    source.unmap();

    const target = device.createBuffer({
      size: byteSize,
      usage: usage.COPY_DST | usage.MAP_READ,
    });

    for (let i = 0; i < iterations; i += 1) {
      const encoder = device.createCommandEncoder();
      encoder.copyBufferToBuffer(source, 0, target, 0, byteSize);
      device.queue.submit([encoder.finish()]);
      await waitForQueueIdle(device);
      iterationsCompleted += 1;
      if (deviceLost) break;
    }

    if (!deviceLost) {
      await target.mapAsync(mapMode.READ);
      const readView = new Uint32Array(target.getMappedRange());
      const ok = readView.length > 0 && readView[0] === 7;
      target.unmap();
      if (!ok) {
        throw new Error('Dữ liệu đọc lại từ GPU không đúng sau vòng copy.');
      }
    }

    source.destroy?.();
    target.destroy?.();
    await Promise.race([
      lostPromise || Promise.resolve(null),
      Promise.resolve(null),
    ]);

    const durationMs = Math.max(1, Date.now() - startedAtMs);
    return {
      success: !deviceLost && iterationsCompleted >= iterations,
      checkedAt: isoNow(),
      iterationsRequested: iterations,
      iterationsCompleted,
      durationMs,
      avgIterationMs: Number((durationMs / Math.max(1, iterationsCompleted)).toFixed(2)),
      throughputOpsPerSecond: Number(((iterationsCompleted * 1000) / durationMs).toFixed(2)),
      deviceLost,
      message: !deviceLost && iterationsCompleted >= iterations
        ? `Stability check hoàn tất ${iterationsCompleted}/${iterations} vòng.`
        : `Stability check dừng sớm ở ${iterationsCompleted}/${iterations} vòng.`,
    };
  } catch (error) {
    const durationMs = Math.max(1, Date.now() - startedAtMs);
    return {
      success: false,
      checkedAt: isoNow(),
      iterationsRequested: iterations,
      iterationsCompleted,
      durationMs,
      avgIterationMs: Number((durationMs / Math.max(1, iterationsCompleted || 1)).toFixed(2)),
      throughputOpsPerSecond: Number(((iterationsCompleted * 1000) / durationMs).toFixed(2)),
      deviceLost,
      message: 'Stability check thất bại.',
      errorMessage: error instanceof Error ? error.message : String(error || 'Unknown error'),
    };
  }
}

export function applyWebGpuCapabilityResult(
  state: WebGpuWeekOneState,
  report: WebGpuCapabilityReport,
): WebGpuWeekOneState {
  let next = {
    ...state,
    updatedAt: isoNow(),
    capability: report,
  };
  if (report.status === 'ready') {
    next = updateWebGpuWeekOneTaskStatus(next, 'feature-flag', 'done');
  } else if (report.status === 'flag_disabled') {
    next = updateWebGpuWeekOneTaskStatus(next, 'feature-flag', 'in_progress');
  }
  return next;
}

export function applyWebGpuStabilityResult(
  state: WebGpuWeekOneState,
  report: WebGpuStabilityReport,
): WebGpuWeekOneState {
  let next = {
    ...state,
    updatedAt: isoNow(),
    stability: report,
  };
  next = updateWebGpuWeekOneTaskStatus(next, 'stability', report.success ? 'done' : 'in_progress');
  return next;
}

