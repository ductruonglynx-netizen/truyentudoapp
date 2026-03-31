import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Trash2, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AiProfileMode, ApiModelOption, ApiProvider, StoredApiKeyRecord } from '../../apiVault';
import { API_PROVIDER_META, PROVIDER_LABELS, PROVIDER_MODEL_OPTIONS } from '../../apiVault';
import { IMAGE_AI_PROVIDER_META, IMAGE_AI_PROVIDER_ORDER, type ImageAiProvider } from '../../imageAiProviders';
import type { GenerationConfig } from '../../generationConfig';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function maskSensitive(value: string, head = 6, tail = 4): string {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  if (raw.length <= head + tail) return raw;
  return `${raw.slice(0, head)}...${raw.slice(-tail)}`;
}

const RELAY_AUTH_BASE = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_RELAY_AUTH_BASE || '').trim();
const EVOLINK_HOME_URL = 'https://evolink.ai';
const EVOLINK_SIGNUP_URL = 'https://evolink.ai/signup';
const EVOLINK_IMAGE_DOCS_URL = 'https://docs.evolink.ai/en/api-manual/image-series/z-image-turbo/z-image-turbo-image-generate';
const CODE_REGEX = /\b(\d{4,8})\b/;
const GENERATION_HINTS: Record<string, string> = {
  temperature: 'Điều chỉnh độ sáng tạo của câu trả lời. Cao thì bay bổng hơn, thấp thì chặt chẽ hơn.',
  topP: 'Giới hạn phạm vi từ vựng được cân nhắc ở mỗi bước. Mốc 0.9-1.0 thường cân bằng.',
  topK: 'Giới hạn số từ tiếp theo mà model được phép cân nhắc. Giá trị thấp cho văn ngắn gọn hơn.',
  maxOutputTokens: 'Số token tối đa model được trả về cho một lần gọi. Tăng quá cao sẽ chậm và tốn chi phí.',
  contextWindowTokens: 'Ngân sách context gửi lên model (prompt + dữ liệu truyện). Nhỏ hơn sẽ tiết kiệm token.',
  seed: 'Đặt số cố định để kết quả lặp lại gần giống nhau. Để -1 nếu muốn ngẫu nhiên mỗi lần.',
  reasoningLevel: 'Mức suy luận nội bộ. High cho chất lượng tốt hơn nhưng thường chậm hơn.',
  enableGeminiWebSearch: 'Cho phép Gemini tra web khi cần dữ liệu thực tế/historical. Chỉ áp dụng nhánh Gemini direct.',
  showThinking: 'Khi model hỗ trợ, sẽ ưu tiên lộ trình suy luận ngắn trước câu trả lời chính.',
  inlineImages: 'Yêu cầu model trả kèm ảnh minh hoạ nếu nhà cung cấp hỗ trợ inline image.',
  enableStreaming: 'Bật để nhận phản hồi dạng streaming từng phần. Tắt để nhận một cục hoàn chỉnh.',
  autoCritique: 'Sau khi sinh bản đầu, hệ thống có thể tự kiểm tra và viết lại nếu chất lượng chưa đạt.',
  multiDraft: 'Tăng số lượt thử để chọn bản tốt hơn cho đoạn khó; đổi lại tốn thêm thời gian.',
  rateLimitDelay: 'Chèn khoảng chờ giữa các call khi dùng proxy/custom endpoint để giảm lỗi 429.',
  fullThinkingPrompt: 'Thêm khung thinking 12 bước cho tác vụ dài/chất lượng cao; token tăng đáng kể.',
};
type GenerationNumericField =
  | 'temperature'
  | 'topP'
  | 'topK'
  | 'maxOutputTokens'
  | 'contextWindowTokens'
  | 'seed';

function buildGenerationNumberDraft(config: GenerationConfig): Record<GenerationNumericField, string> {
  return {
    temperature: String(config.temperature),
    topP: String(config.topP),
    topK: String(config.topK),
    maxOutputTokens: String(config.maxOutputTokens),
    contextWindowTokens: String(config.contextWindowTokens),
    seed: String(config.seed),
  };
}

function parseLocaleNumber(raw: string): number {
  return Number(String(raw || '').trim().replace(',', '.'));
}

function toWsUrl(url: string): string {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('wss://') || u.startsWith('ws://')) return u;
  if (u.startsWith('https://')) return `wss://${u.slice('https://'.length)}`;
  if (u.startsWith('http://')) return `ws://${u.slice('http://'.length)}`;
  return `wss://${u.replace(/^\/+/, '')}`;
}

function buildRelaySocketUrl(base: string, code: string): string {
  const cleanBase = toWsUrl(base).trim();
  const cleanCode = String(code || '').trim();
  if (!cleanBase || !cleanCode) return cleanBase;

  try {
    const url = new URL(cleanBase);
    if (/[?&]code=/i.test(cleanBase)) {
      url.searchParams.set('code', cleanCode);
      return url.toString();
    }
    url.searchParams.delete('code');
    url.pathname = `${url.pathname.replace(/\/\d{4,8}\/?$/i, '').replace(/\/+$/, '')}/${cleanCode}`;
    return url.toString();
  } catch {
    return `${cleanBase.replace(/\/+$/, '')}/${cleanCode}`;
  }
}

function buildRelayPublishUrl(base: string, code: string): string {
  const cleanBase = String(base || '').trim().replace(/\/+$/, '');
  const cleanCode = String(code || '').trim();
  if (!cleanBase || !cleanCode) return '';
  return `${cleanBase}/publish-token/${cleanCode}`;
}

interface ApiSectionPanelProps {
  onBack: () => void;
  apiMode: 'manual' | 'relay';
  currentProviderLabel: string;
  currentModelLabel: string;
  vaultCount: number;
  currentStatusLabel: string;
  onSwitchToDirect: () => void;
  onSwitchToRelay: () => void;
  apiEntryName: string;
  apiEntryText: string;
  displayedDraftProvider: ApiProvider;
  effectiveDraftProvider: ApiProvider;
  availableDraftModels: ApiModelOption[];
  apiEntryModel: string;
  apiEntryBaseUrl: string;
  aiProfile: AiProfileMode;
  apiVault: StoredApiKeyRecord[];
  currentApiEntry?: StoredApiKeyRecord;
  testingApiId?: string | null;
  relayStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  relayStatusText: string;
  relayUrl: string;
  relayMatchedLong: string;
  relayMaskedToken: string;
  relayModel: string;
  relayModelOptions: ApiModelOption[];
  relayWebBase: string;
  relaySocketBase: string;
  manualRelayTokenInput: string;
  isCheckingAi?: boolean;
  aiCheckStatus?: string;
  aiUsageRequests?: number;
  aiUsageTokens?: number;
  quickImportText?: string;
  quickImportResult?: string;
  generationConfig: GenerationConfig;
  imageAiEnabled: boolean;
  imageAiApiKey: string;
  imageAiStatusLabel: string;
  imageAiProvider: ImageAiProvider;
  imageAiModel: string;
  onApiEntryNameChange: (value: string) => void;
  onApiEntryTextChange: (value: string) => void;
  onApiEntryProviderChange: (value: ApiProvider) => void;
  onApiEntryModelChange: (value: string) => void;
  onApiEntryBaseUrlChange: (value: string) => void;
  onImageAiEnabledChange: (value: boolean) => void;
  onImageAiApiKeyChange: (value: string) => void;
  onImageAiProviderChange: (value: ImageAiProvider) => void;
  onImageAiModelChange: (value: string) => void;
  onSaveImageAiConfig: () => void;
  onSaveApiEntry: () => void;
  onTestApiEntry: (id: string) => void;
  onActivateApiEntry: (id: string) => void;
  onDeleteApiEntry: (id: string) => void;
  onStoredApiModelChange: (id: string, value: string) => void;
  onStoredApiBaseUrlChange: (id: string, value: string) => void;
  onConnectRelay: (relayCode?: string) => void;
  onDisconnectRelay: () => void;
  onRelayUrlChange: (value: string) => void;
  onRelayModelChange: (value: string) => void;
  onManualRelayTokenInputChange: (value: string) => void;
  onSaveManualRelayToken: () => void;
  onCheckAiHealth?: () => void;
  onResetAiUsage?: () => void;
  onQuickImportTextChange?: (value: string) => void;
  onQuickImportKeys?: () => void;
  onAiProfileChange?: (value: AiProfileMode) => void;
  onGenerationConfigPatch: (patch: Partial<GenerationConfig>) => void;
  onGenerationConfigReset: () => void;
}

export function ApiSectionPanel({
  onBack,
  apiMode,
  currentProviderLabel,
  currentModelLabel,
  vaultCount,
  currentStatusLabel,
  onSwitchToDirect,
  onSwitchToRelay,
  apiEntryName,
  apiEntryText,
  displayedDraftProvider,
  effectiveDraftProvider,
  availableDraftModels,
  apiEntryModel,
  apiEntryBaseUrl,
  apiVault,
  currentApiEntry,
  relayStatus,
  relayStatusText,
  relayUrl,
  relayMatchedLong,
  relayMaskedToken,
  relayModel,
  relayModelOptions,
  relayWebBase,
  relaySocketBase,
  manualRelayTokenInput,
  generationConfig,
  imageAiEnabled,
  imageAiApiKey,
  imageAiStatusLabel,
  imageAiProvider,
  imageAiModel,
  onApiEntryNameChange,
  onApiEntryTextChange,
  onApiEntryProviderChange,
  onApiEntryModelChange,
  onApiEntryBaseUrlChange,
  onImageAiEnabledChange,
  onImageAiApiKeyChange,
  onImageAiProviderChange,
  onImageAiModelChange,
  onSaveImageAiConfig,
  onSaveApiEntry,
  onTestApiEntry,
  onActivateApiEntry,
  onDeleteApiEntry,
  onStoredApiModelChange,
  onStoredApiBaseUrlChange,
  onConnectRelay,
  onDisconnectRelay,
  onRelayUrlChange,
  onRelayModelChange,
  onManualRelayTokenInputChange,
  onSaveManualRelayToken,
  onGenerationConfigPatch,
  onGenerationConfigReset,
}: ApiSectionPanelProps) {
  const OPENROUTER_CUSTOM_MODEL_OPTION = '__openrouter_custom_model__';
  const [relayCode, setRelayCode] = useState('');
  const [draftOpenRouterCustomModel, setDraftOpenRouterCustomModel] = useState(false);
  const [storedOpenRouterCustomModels, setStoredOpenRouterCustomModels] = useState<Record<string, boolean>>({});
  const [openGenerationHint, setOpenGenerationHint] = useState<string | null>(null);
  const [generationNumberDraft, setGenerationNumberDraft] = useState<Record<GenerationNumericField, string>>(
    () => buildGenerationNumberDraft(generationConfig),
  );
  const lastSyncedRelayUrlCodeRef = React.useRef('');
  const imageProviderMeta = IMAGE_AI_PROVIDER_META[imageAiProvider];
  const imageModelOptions = imageProviderMeta.models;
  const textProviderMeta = API_PROVIDER_META[effectiveDraftProvider === 'unknown' ? 'gemini' : effectiveDraftProvider];
  const selectedTextModelMeta = availableDraftModels.find((item) => item.value === apiEntryModel);
  const listedOpenRouterModels = PROVIDER_MODEL_OPTIONS.openrouter || [];
  const isDraftOpenRouter = effectiveDraftProvider === 'openrouter';

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get('code') || '';
      const fromPath = window.location.pathname.split('/').filter(Boolean)[0] || '';
      const code = /^\d{4,8}$/.test(fromPath) ? fromPath : fromQuery;
      if (/^\d{4,8}$/.test(code)) {
        setRelayCode(code);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Cập nhật code nếu người dùng dán URL relay có chứa code
  useEffect(() => {
    if (relayUrl) {
      const match = relayUrl.match(CODE_REGEX);
      const nextCode = match?.[1] || '';
      if (!nextCode) {
        lastSyncedRelayUrlCodeRef.current = '';
        return;
      }
      if (nextCode !== lastSyncedRelayUrlCodeRef.current && nextCode !== relayCode) {
        lastSyncedRelayUrlCodeRef.current = nextCode;
        setRelayCode(nextCode);
      }
    }
  }, [relayUrl, relayCode]);

  useEffect(() => {
    if (!isDraftOpenRouter) {
      setDraftOpenRouterCustomModel(false);
      return;
    }
    const listed = listedOpenRouterModels.some((model) => model.value === apiEntryModel);
    setDraftOpenRouterCustomModel(Boolean(apiEntryModel.trim()) && !listed);
  }, [apiEntryModel, isDraftOpenRouter, listedOpenRouterModels]);

  useEffect(() => {
    setStoredOpenRouterCustomModels((prev) => {
      const next: Record<string, boolean> = { ...prev };
      apiVault.forEach((item) => {
        if (item.provider !== 'openrouter') return;
        const listed = listedOpenRouterModels.some((model) => model.value === item.model);
        if (Boolean(item.model?.trim()) && !listed) {
          next[item.id] = true;
        } else if (!(item.id in next)) {
          next[item.id] = false;
        }
      });
      Object.keys(next).forEach((id) => {
        const exists = apiVault.some((item) => item.id === id && item.provider === 'openrouter');
        if (!exists) delete next[id];
      });
      return next;
    });
  }, [apiVault, listedOpenRouterModels]);

  useEffect(() => {
    setGenerationNumberDraft(buildGenerationNumberDraft(generationConfig));
  }, [
    generationConfig.temperature,
    generationConfig.topP,
    generationConfig.topK,
    generationConfig.maxOutputTokens,
    generationConfig.contextWindowTokens,
    generationConfig.seed,
  ]);

  const relayConnectUrl = useMemo(() => {
    const code = relayCode || '';
    return code ? buildRelaySocketUrl(relaySocketBase, code) : '';
  }, [relayCode, relaySocketBase]);

  const relayPublishUrl = useMemo(() => {
    const code = relayCode || '';
    return code ? buildRelayPublishUrl(relayWebBase, code) : '';
  }, [relayCode, relayWebBase]);

  const authLink = useMemo(() => {
    const code = relayCode || '';
    if (!code || !RELAY_AUTH_BASE) return '';
    let url: URL;
    try {
      url = new URL(RELAY_AUTH_BASE);
    } catch {
      return '';
    }
    url.searchParams.set('code', code);
    url.searchParams.set('relay', relayConnectUrl);
    url.searchParams.set('worker', relayWebBase);
    url.searchParams.set('publish', relayPublishUrl);
    return url.toString();
  }, [relayCode, relayConnectUrl, relayPublishUrl, relayWebBase]);

  const handleStartRelayListening = () => {
    if (!relayCode) return;
    if (relayConnectUrl && relayUrl !== relayConnectUrl) {
      onRelayUrlChange(relayConnectUrl);
    }
    onConnectRelay(relayCode);
  };

  const handleOpenBridge = () => {
    if (!authLink) return;
    handleStartRelayListening();
    window.open(authLink, '_blank', 'noopener,noreferrer');
  };
  const renderGenerationHelpButton = (hintKey: keyof typeof GENERATION_HINTS) => (
    <button
      type="button"
      onClick={() => setOpenGenerationHint((prev) => (prev === hintKey ? null : hintKey))}
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
        openGenerationHint === hintKey
          ? "border-indigo-300 bg-indigo-500/25 text-indigo-100"
          : "border-white/20 bg-slate-900/60 text-slate-300 hover:border-indigo-300/70 hover:text-white",
      )}
      title="Giải thích"
      aria-label={`Giải thích ${hintKey}`}
    >
      !
    </button>
  );
  const renderGenerationHint = (hintKey: keyof typeof GENERATION_HINTS) =>
    openGenerationHint === hintKey ? (
      <p className="text-xs text-indigo-100/90 mt-2 rounded-lg border border-indigo-300/30 bg-indigo-500/10 px-3 py-2">
        {GENERATION_HINTS[hintKey]}
      </p>
    ) : null;
  const updateGenerationDraftField = (field: GenerationNumericField, value: string) => {
    setGenerationNumberDraft((prev) => ({ ...prev, [field]: value }));
  };
  const commitGenerationDraftField = (field: GenerationNumericField) => {
    const raw = String(generationNumberDraft[field] || '').trim();
    if (!raw) {
      setGenerationNumberDraft(buildGenerationNumberDraft(generationConfig));
      return;
    }
    const parsed = parseLocaleNumber(raw);
    if (!Number.isFinite(parsed)) {
      setGenerationNumberDraft(buildGenerationNumberDraft(generationConfig));
      return;
    }
    onGenerationConfigPatch({ [field]: parsed } as Partial<GenerationConfig>);
  };
  const handleGenerationNumberKeyDown = (field: GenerationNumericField, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commitGenerationDraftField(field);
    event.currentTarget.blur();
  };
  return (
    <div className="max-w-5xl mx-auto pt-28 pb-12 px-4 md:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0"><ChevronLeft /></button>
        <div>
          <h2 className="text-2xl font-serif font-bold">AI Văn bản</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="tf-card p-3 text-sm">
          <p className="text-slate-300">Nhà cung cấp</p>
          <p className="text-lg font-semibold text-white">{currentProviderLabel}</p>
        </div>
        <div className="tf-card p-3 text-sm">
          <p className="text-slate-300">Model</p>
          <p className="text-lg font-semibold text-white">{currentModelLabel}</p>
        </div>
        <div className="tf-card p-3 text-sm">
          <p className="text-slate-300">Trạng thái</p>
          <p className="text-lg font-semibold text-white">{currentStatusLabel}</p>
        </div>
      </div>

      <div className="tf-card p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-200">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white">AI Văn bản</h3>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={apiEntryName}
                onChange={(e) => onApiEntryNameChange(e.target.value)}
                className="tf-input"
                placeholder="Tên gợi nhớ (vd: Gemini chính)"
              />
              <select
                value={displayedDraftProvider}
                onChange={(e) => onApiEntryProviderChange(e.target.value as ApiProvider)}
                className="tf-input"
              >
                <option value="gemini">Gemini</option>
                <option value="xai">xAI / Grok</option>
                <option value="groq">Groq</option>
                <option value="deepseek">DeepSeek</option>
                <option value="openrouter">OpenRouter</option>
                <option value="mistral">Mistral AI</option>
                <option value="ollama">Ollama Local</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">{textProviderMeta.title}</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                  {selectedTextModelMeta?.label || apiEntryModel || 'Chưa chọn model'}
                </span>
              </div>
              <p className="text-sm text-slate-300">Ưu điểm: {textProviderMeta.strengths}</p>
              <p className="text-sm text-amber-200">Điểm yếu / lưu ý: {textProviderMeta.tradeoffs}</p>
              {selectedTextModelMeta ? (
                <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                  {selectedTextModelMeta.description}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3 text-sm">
                {textProviderMeta.keyUrl ? (
                  <a href={textProviderMeta.keyUrl} target="_blank" rel="noreferrer" className="tf-btn tf-btn-ghost">
                    Lấy API key
                  </a>
                ) : null}
                <a href={textProviderMeta.docsUrl} target="_blank" rel="noreferrer" className="tf-btn tf-btn-ghost">
                  Xem tài liệu
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {effectiveDraftProvider === 'custom' || effectiveDraftProvider === 'ollama' ? (
                <input
                  value={apiEntryModel}
                  onChange={(e) => onApiEntryModelChange(e.target.value)}
                  className="tf-input"
                  placeholder={
                    effectiveDraftProvider === 'ollama'
                      ? 'Model Ollama (vd: qwen2.5:7b)'
                      : 'Model custom (vd: llama-3.1-70b)'
                  }
                />
              ) : (
                <select
                  value={
                    isDraftOpenRouter && draftOpenRouterCustomModel
                      ? OPENROUTER_CUSTOM_MODEL_OPTION
                      : apiEntryModel
                  }
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (isDraftOpenRouter && nextValue === OPENROUTER_CUSTOM_MODEL_OPTION) {
                      setDraftOpenRouterCustomModel(true);
                      onApiEntryModelChange('');
                      return;
                    }
                    setDraftOpenRouterCustomModel(false);
                    onApiEntryModelChange(nextValue);
                  }}
                  className="tf-input"
                >
                  {availableDraftModels.map((model) => (
                    <option key={model.value} value={model.value}>{model.label}</option>
                  ))}
                  {isDraftOpenRouter ? (
                    <option value={OPENROUTER_CUSTOM_MODEL_OPTION}>Tự nhập model OpenRouter…</option>
                  ) : null}
                </select>
              )}
              <input
                value={apiEntryBaseUrl}
                onChange={(e) => onApiEntryBaseUrlChange(e.target.value)}
                className="tf-input"
                placeholder="Base URL (để trống nếu không dùng proxy)"
              />
            </div>

            {isDraftOpenRouter && draftOpenRouterCustomModel ? (
              <input
                value={apiEntryModel}
                onChange={(e) => onApiEntryModelChange(e.target.value)}
                className="tf-input"
                placeholder="Model OpenRouter (vd: meta-llama/llama-3.1-70b-instruct)"
              />
            ) : null}

            <textarea
              value={apiEntryText}
              onChange={(e) => onApiEntryTextChange(e.target.value)}
              className="tf-textarea"
              placeholder={
                effectiveDraftProvider === 'ollama'
                  ? 'Ollama local không bắt buộc API key. Có thể để trống.'
                  : 'Dán API key hoặc mã đăng nhập Google (ya29...)'
              }
            />

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-end tf-actions-mobile">
              <button onClick={onSaveApiEntry} className="tf-btn tf-btn-primary">Lưu</button>
              <button
                onClick={() => currentApiEntry?.id && onTestApiEntry(currentApiEntry.id)}
                disabled={!currentApiEntry?.id}
                className="tf-btn tf-btn-ghost disabled:opacity-50"
              >
                Kiểm tra
              </button>
            </div>

            <div className="tf-card p-4 space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-semibold text-white">Đã lưu ({vaultCount})</p>
                <span className="text-xs text-slate-400">Chọn “Dùng” để kích hoạt</span>
              </div>
              {currentStatusLabel ? (
                <p className="text-xs text-emerald-200">
                  Trạng thái kiểm tra gần nhất: <span className="font-semibold text-white">{currentStatusLabel}</span>
                </p>
              ) : null}
              <div className="divide-y divide-white/10">
                {apiVault.length === 0 && <p className="text-sm text-slate-400 py-2">Chưa có kết nối.</p>}
                {apiVault.map((item) => (
                  <div key={item.id} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-white tf-break-long">{item.name || 'Chưa đặt tên'}</p>
                      <p className="text-xs text-slate-400 flex gap-2 flex-wrap items-center min-w-0">
                        <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white">{PROVIDER_LABELS[item.provider]}</span>
                        <span className="tf-break-long">{item.model || 'Model?'}</span>
                        {item.baseUrl && <span className="text-[11px] text-slate-500 tf-break-all">{item.baseUrl}</span>}
                        <span className="text-[11px] text-slate-500 tf-break-all">•••{maskSensitive(item.key || '')}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-semibold",
                          item.status === 'valid' ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/60" :
                          item.status === 'invalid' ? "bg-rose-500/10 text-rose-100 border border-rose-400/60" :
                          "bg-white/5 text-slate-200 border border-white/10"
                        )}>
                          {item.status === 'valid' ? 'OK' : item.status === 'invalid' ? 'Lỗi' : 'Chưa test'}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
                      <select
                        value={
                          item.provider === 'openrouter' && storedOpenRouterCustomModels[item.id]
                            ? OPENROUTER_CUSTOM_MODEL_OPTION
                            : (item.model || '')
                        }
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          if (item.provider === 'openrouter' && nextValue === OPENROUTER_CUSTOM_MODEL_OPTION) {
                            setStoredOpenRouterCustomModels((prev) => ({ ...prev, [item.id]: true }));
                            onStoredApiModelChange(item.id, '');
                            return;
                          }
                          if (item.provider === 'openrouter') {
                            setStoredOpenRouterCustomModels((prev) => ({ ...prev, [item.id]: false }));
                          }
                          onStoredApiModelChange(item.id, nextValue);
                        }}
                        className="text-xs rounded-md border border-white/10 bg-slate-900/60 text-white px-2 py-1 min-w-0"
                      >
                        {PROVIDER_MODEL_OPTIONS[item.provider || 'gemini']?.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                        {item.provider === 'openrouter' ? (
                          <option value={OPENROUTER_CUSTOM_MODEL_OPTION}>Tự nhập model OpenRouter…</option>
                        ) : null}
                      </select>
                      {item.provider === 'openrouter' && storedOpenRouterCustomModels[item.id] ? (
                        <input
                          value={item.model || ''}
                          onChange={(e) => onStoredApiModelChange(item.id, e.target.value)}
                          className="text-xs rounded-md border border-white/10 bg-slate-900/60 text-white px-2 py-1 w-full sm:w-52"
                          placeholder="Model OpenRouter tùy chỉnh"
                        />
                      ) : null}
                      <input
                        value={item.baseUrl || ''}
                        onChange={(e) => onStoredApiBaseUrlChange(item.id, e.target.value)}
                        className="text-xs rounded-md border border-white/10 bg-slate-900/60 text-white px-2 py-1 w-full sm:w-32 tf-break-all"
                        placeholder="Base URL"
                      />
                      <button
                        onClick={() => onActivateApiEntry(item.id)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-semibold",
                          currentApiEntry?.id === item.id ? "bg-emerald-600 text-white" : "border border-white/10 text-white hover:bg-white/5"
                        )}
                      >
                        Dùng
                      </button>
                      <button onClick={() => onTestApiEntry(item.id)} className="px-3 py-1 rounded-md text-xs border border-white/10 text-white/80 hover:bg-white/5">
                        {currentApiEntry?.id === item.id ? 'Test hiện tại' : 'Test'}
                      </button>
                      <button onClick={() => onDeleteApiEntry(item.id)} className="p-2 rounded-md text-white/60 hover:text-red-400 hover:bg-red-900/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tf-card p-6 space-y-4 border border-indigo-400/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Thông số sinh văn bản (Generation Config)</h3>
            <p className="text-sm text-slate-300 mt-1">
              Bố cục này tối ưu cho chỉnh nhanh: mỗi chức năng có nút <span className="font-semibold text-white">!</span> ở cuối để xem giải thích.
            </p>
          </div>
          <button onClick={onGenerationConfigReset} className="tf-btn tf-btn-ghost">
            Khôi phục mặc định
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-200">Nhiệt độ (Temperature)</span>
              {renderGenerationHelpButton('temperature')}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={generationNumberDraft.temperature}
              onChange={(e) => updateGenerationDraftField('temperature', e.target.value)}
              onBlur={() => commitGenerationDraftField('temperature')}
              onKeyDown={(e) => handleGenerationNumberKeyDown('temperature', e)}
              className="tf-input mt-2"
            />
            {renderGenerationHint('temperature')}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-200">Top P</span>
              {renderGenerationHelpButton('topP')}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={generationNumberDraft.topP}
              onChange={(e) => updateGenerationDraftField('topP', e.target.value)}
              onBlur={() => commitGenerationDraftField('topP')}
              onKeyDown={(e) => handleGenerationNumberKeyDown('topP', e)}
              className="tf-input mt-2"
            />
            {renderGenerationHint('topP')}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-200">Top K</span>
              {renderGenerationHelpButton('topK')}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={generationNumberDraft.topK}
              onChange={(e) => updateGenerationDraftField('topK', e.target.value)}
              onBlur={() => commitGenerationDraftField('topK')}
              onKeyDown={(e) => handleGenerationNumberKeyDown('topK', e)}
              className="tf-input mt-2"
            />
            {renderGenerationHint('topK')}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-200">Kích thước phản hồi tối đa (Max Output Tokens)</span>
              {renderGenerationHelpButton('maxOutputTokens')}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={generationNumberDraft.maxOutputTokens}
              onChange={(e) => updateGenerationDraftField('maxOutputTokens', e.target.value)}
              onBlur={() => commitGenerationDraftField('maxOutputTokens')}
              onKeyDown={(e) => handleGenerationNumberKeyDown('maxOutputTokens', e)}
              className="tf-input mt-2"
            />
            {renderGenerationHint('maxOutputTokens')}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-200">Kích thước Context (token)</span>
              {renderGenerationHelpButton('contextWindowTokens')}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={generationNumberDraft.contextWindowTokens}
              onChange={(e) => updateGenerationDraftField('contextWindowTokens', e.target.value)}
              onBlur={() => commitGenerationDraftField('contextWindowTokens')}
              onKeyDown={(e) => handleGenerationNumberKeyDown('contextWindowTokens', e)}
              className="tf-input mt-2"
            />
            {renderGenerationHint('contextWindowTokens')}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-200">Hạt giống (Seed)</span>
              {renderGenerationHelpButton('seed')}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={generationNumberDraft.seed}
              onChange={(e) => updateGenerationDraftField('seed', e.target.value)}
              onBlur={() => commitGenerationDraftField('seed')}
              onKeyDown={(e) => handleGenerationNumberKeyDown('seed', e)}
              className="tf-input mt-2"
            />
            {renderGenerationHint('seed')}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3 md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-200">Suy nghĩ AI (Thinking / Reasoning)</span>
              {renderGenerationHelpButton('reasoningLevel')}
            </div>
            <select
              value={generationConfig.reasoningLevel}
              onChange={(e) => onGenerationConfigPatch({ reasoningLevel: e.target.value as GenerationConfig['reasoningLevel'] })}
              className="tf-input mt-2"
            >
              <option value="low">Thấp (Low)</option>
              <option value="medium">Trung bình (Medium)</option>
              <option value="high">Cao (High)</option>
            </select>
            {renderGenerationHint('reasoningLevel')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <label className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationConfig.enableGeminiWebSearch}
                  onChange={(e) => onGenerationConfigPatch({ enableGeminiWebSearch: e.target.checked })}
                />
                <span>Bật Google Web Search (Gemini Direct API)</span>
              </span>
              {renderGenerationHelpButton('enableGeminiWebSearch')}
            </div>
            {renderGenerationHint('enableGeminiWebSearch')}
          </label>

          <label className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationConfig.showThinking}
                  onChange={(e) => onGenerationConfigPatch({ showThinking: e.target.checked })}
                />
                <span>Hiện thinking</span>
              </span>
              {renderGenerationHelpButton('showThinking')}
            </div>
            {renderGenerationHint('showThinking')}
          </label>

          <label className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationConfig.inlineImages}
                  onChange={(e) => onGenerationConfigPatch({ inlineImages: e.target.checked })}
                />
                <span>Yêu cầu AI tạo ảnh minh hoạ (Inline Images)</span>
              </span>
              {renderGenerationHelpButton('inlineImages')}
            </div>
            {renderGenerationHint('inlineImages')}
          </label>

          <label className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationConfig.enableStreaming}
                  onChange={(e) => onGenerationConfigPatch({ enableStreaming: e.target.checked })}
                />
                <span>Phát trực tiếp (Streaming)</span>
              </span>
              {renderGenerationHelpButton('enableStreaming')}
            </div>
            {renderGenerationHint('enableStreaming')}
          </label>

          <label className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationConfig.autoCritique}
                  onChange={(e) => onGenerationConfigPatch({ autoCritique: e.target.checked })}
                />
                <span>Tự động phê bình & chỉnh sửa (Auto-Critique)</span>
              </span>
              {renderGenerationHelpButton('autoCritique')}
            </div>
            {renderGenerationHint('autoCritique')}
          </label>

          <label className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationConfig.multiDraft}
                  onChange={(e) => onGenerationConfigPatch({ multiDraft: e.target.checked })}
                />
                <span>Multi-Draft cho cảnh quan trọng</span>
              </span>
              {renderGenerationHelpButton('multiDraft')}
            </div>
            {renderGenerationHint('multiDraft')}
          </label>

          <label className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationConfig.rateLimitDelay}
                  onChange={(e) => onGenerationConfigPatch({ rateLimitDelay: e.target.checked })}
                />
                <span>Chống giới hạn tốc độ (Rate Limit Delay)</span>
              </span>
              {renderGenerationHelpButton('rateLimitDelay')}
            </div>
            {renderGenerationHint('rateLimitDelay')}
          </label>

          <label className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationConfig.fullThinkingPrompt}
                  onChange={(e) => onGenerationConfigPatch({ fullThinkingPrompt: e.target.checked })}
                />
                <span>Thinking Prompt đầy đủ (12 bước)</span>
              </span>
              {renderGenerationHelpButton('fullThinkingPrompt')}
            </div>
            {renderGenerationHint('fullThinkingPrompt')}
          </label>
        </div>
      </div>

      <div className="tf-card p-6 space-y-4 border border-sky-400/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-sky-500/15 p-2 text-sky-200">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Sinh ảnh</p>
                <p className="text-xs text-slate-300">Kênh riêng chỉ dùng cho việc tạo ảnh bìa. Không ảnh hưởng đến dịch truyện, Writer Pro hay các lệnh text AI khác.</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Khi bật và có API key, nút <span className="font-semibold text-white">Tạo bìa bằng AI</span> sẽ ưu tiên gửi prompt sang nhà phát triển ảnh bạn chọn.
              Khi tắt, TruyenForge sẽ bỏ qua nhánh này và chuyển sang các đường tạo ảnh dự phòng khác.
            </p>
          </div>

          <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={imageAiEnabled}
              onChange={(e) => onImageAiEnabledChange(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-400"
            />
            <span className="text-sm font-semibold text-white">{imageAiEnabled ? 'Đang bật' : 'Đang tắt'}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Nhà phát triển</span>
            <select
              value={imageAiProvider}
              onChange={(e) => onImageAiProviderChange(e.target.value as ImageAiProvider)}
              className="tf-input"
            >
              {IMAGE_AI_PROVIDER_ORDER.map((provider) => (
                <option key={provider} value={provider}>
                  {IMAGE_AI_PROVIDER_META[provider].label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Model ảnh</span>
            <select
              value={imageAiModel}
              onChange={(e) => onImageAiModelChange(e.target.value)}
              className="tf-input"
            >
              {imageModelOptions.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{imageProviderMeta.label}</p>
            <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-200">
              {imageModelOptions.find((item) => item.value === imageAiModel)?.label || imageAiModel}
            </span>
          </div>
          <p className="text-sm text-slate-300">{imageProviderMeta.summary}</p>
          <p className="text-sm text-emerald-200">Ưu điểm: {imageProviderMeta.strengths}</p>
          <p className="text-sm text-amber-200">Lưu ý: {imageProviderMeta.tradeoffs}</p>
          <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
            {imageModelOptions.find((item) => item.value === imageAiModel)?.description || 'Chọn model để xem mô tả chi tiết.'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={imageAiApiKey}
            onChange={(e) => onImageAiApiKeyChange(e.target.value)}
            className="tf-input"
            placeholder={imageProviderMeta.keyPlaceholder}
          />
          <button onClick={onSaveImageAiConfig} className="tf-btn tf-btn-primary">
            Lưu AI Sinh ảnh
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Trạng thái hiện tại</p>
          <p className="text-sm text-white">{imageAiStatusLabel}</p>
          <p className="text-xs text-slate-400">{imageProviderMeta.keyLabel} này chỉ được lưu cục bộ trên trình duyệt/máy hiện tại, không dùng để thay thế khóa AI viết và dịch.</p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <a href={imageProviderMeta.signupUrl} target="_blank" rel="noreferrer" className="tf-btn tf-btn-ghost">
            Mở Trang Nhà Phát Triển
          </a>
          <a href={imageProviderMeta.signupUrl} target="_blank" rel="noreferrer" className="tf-btn tf-btn-ghost">
            Đăng ký / Đăng nhập
          </a>
          <a href={imageProviderMeta.docsUrl} target="_blank" rel="noreferrer" className="tf-btn tf-btn-ghost">
            Xem tài liệu API ảnh
          </a>
        </div>

        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-white">Cách lấy API key</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-300">
            <li>Mở trang <a href={imageProviderMeta.signupUrl} target="_blank" rel="noreferrer" className="text-sky-300 underline underline-offset-2">{imageProviderMeta.signupUrl.replace(/^https?:\/\//, '')}</a> rồi đăng ký hoặc đăng nhập.</li>
            <li>Vào dashboard của nhà phát triển và mở khu vực quản lý API key.</li>
            <li>Tạo hoặc sao chép khóa theo đúng định dạng mà nhà cung cấp đó cấp cho bạn.</li>
            <li>Chọn đúng <span className="font-semibold text-white">Nhà phát triển</span> và <span className="font-semibold text-white">Model ảnh</span>, dán key vào ô phía trên, bật <span className="font-semibold text-white">AI Sinh ảnh</span>, rồi bấm <span className="font-semibold text-white">Lưu AI Sinh ảnh</span>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
