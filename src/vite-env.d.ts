/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_RELAY_WS_BASE?: string;
  readonly VITE_RELAY_WEB_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

