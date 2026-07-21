/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_MOCK?: string;
  readonly VITE_TEMPLATE_ENABLE_LOCALE_SWITCH?: string;
  readonly VITE_TEMPLATE_NAVIGATION_MODE?: 'local' | 'server';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
