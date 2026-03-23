import type { AiProvider } from '../phase0/aiGateway';

export interface Phase1ApiConfig {
  openaiKey: string;
  anthropicKey: string;
  geminiKey: string;
  providerOrder: AiProvider[];
}

const STORAGE_KEY = 'phase1_ai_config_v1';

const DEFAULT_CONFIG: Phase1ApiConfig = {
  openaiKey: '',
  anthropicKey: '',
  geminiKey: '',
  providerOrder: ['openai', 'anthropic', 'gemini'],
};

function normalizeOrder(input?: AiProvider[]): AiProvider[] {
  const supported: AiProvider[] = ['openai', 'anthropic', 'gemini'];
  const unique = (input || []).filter((p): p is AiProvider => supported.includes(p as AiProvider));
  const seen = new Set<AiProvider>();
  const clean: AiProvider[] = [];

  unique.forEach((p) => {
    if (seen.has(p)) return;
    seen.add(p);
    clean.push(p);
  });

  supported.forEach((p) => {
    if (!seen.has(p)) clean.push(p);
  });

  return clean;
}

export function loadPhase1ApiConfig(): Phase1ApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<Phase1ApiConfig>;
    return {
      openaiKey: parsed.openaiKey || '',
      anthropicKey: parsed.anthropicKey || '',
      geminiKey: parsed.geminiKey || '',
      providerOrder: normalizeOrder(parsed.providerOrder),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function savePhase1ApiConfig(config: Phase1ApiConfig): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...config,
      providerOrder: normalizeOrder(config.providerOrder),
    }),
  );
}

export function reorderProviders(config: Phase1ApiConfig, index: number, provider: AiProvider): Phase1ApiConfig {
  const order = [...normalizeOrder(config.providerOrder)];
  const oldIndex = order.indexOf(provider);

  if (oldIndex >= 0) {
    order.splice(oldIndex, 1);
  }

  order.splice(index, 0, provider);

  return {
    ...config,
    providerOrder: normalizeOrder(order),
  };
}

export function maskKey(key: string): string {
  if (!key) return 'Not set';
  if (key.length <= 8) return `${key.slice(0, 2)}***`;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
