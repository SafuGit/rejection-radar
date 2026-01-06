// Source - https://stackoverflow.com/a
// Posted by Sayvai
// Retrieved 2026-01-06, License - CC BY-SA 4.0

/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />

// Source - https://stackoverflow.com/a
// Posted by Menial Orchestra
// Retrieved 2026-01-06, License - CC BY-SA 4.0

interface ImportMetaEnv {
  readonly VITE_DATABASE_URL: string;

}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
