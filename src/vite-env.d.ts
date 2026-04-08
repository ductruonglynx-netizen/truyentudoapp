/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_RELAY_WS_BASE?: string;
  readonly VITE_RELAY_WEB_BASE?: string;
  readonly VITE_ENABLE_API_TELEMETRY?: string;
  readonly VITE_SUPABASE_API_TELEMETRY_TABLE?: string;
  readonly VITE_ENABLE_WEBGPU?: string;
  readonly VITE_WEBGPU_STABILITY_ITERATIONS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

