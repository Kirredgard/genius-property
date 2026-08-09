export {};

declare global {
  interface Window {
    GPV21_ENABLE_LEGACY?: boolean;
    GPV21_ENABLE_HOTFIXES?: boolean;
    GPV21_BOOTSTRAPPED?: boolean;
    GPV21Firebase?: {
      app?: unknown;
      db?: unknown;
      auth?: unknown;
    };
    GPV21LegacyRegistry?: {
      register: (name: string, value: unknown) => unknown;
      get: (name: string, fallback?: unknown) => unknown;
      has: (name: string) => boolean;
      list: () => string[];
      unregister: (name: string) => void;
    };
    GPV21MigratedDomains?: string[];
    db?: unknown;
  }
}
