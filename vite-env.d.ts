/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_KIE_API_KEY?: string;
  VITE_DEEPSEEK_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Speech Recognition API types (types already declared in index.tsx)
