/**
     * Chargeur de hotfixes V21.
     *
     * Les hotfixes ne doivent plus être chargés automatiquement dans le flux V21.
     * Activation temporaire :
     * - index.v21-clean.html?hotfix=1
     * - ou window.GPV21_ENABLE_HOTFIXES = true
     */

    export const HOTFIX_SCRIPTS = [
  "js/core/consolidated-hotfixes.js",
  "js/core/avenir-kpi-fix.js",
  "js/core/paiements-avenir-button-final-fix.js",
  "js/core/dashboard-actions-fix.js",
  "js/core/flicker-fix.js"
];

    export function shouldLoadHotfixes() {
      if (typeof window === 'undefined') return false;

      const params = new URLSearchParams(window.location.search);
      return window.GPV21_ENABLE_HOTFIXES === true || params.get('hotfix') === '1';
    }

    export async function loadHotfixScripts(options = {}) {
      const enabled = options.enabled ?? shouldLoadHotfixes();

      if (!enabled) {
        console.info('[V21][HotfixLoader] Hotfixes désactivés.');
        return { loaded: false, count: 0 };
      }

      let loadedCount = 0;

      for (const src of HOTFIX_SCRIPTS) {
        await injectScript(src);
        loadedCount += 1;
      }

      console.info(`[V21][HotfixLoader] ${loadedCount} hotfix(es) chargé(s).`);
      return { loaded: true, count: loadedCount };
    }

    function injectScript(src) {
      return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') return resolve();

        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) return resolve();

        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.dataset.v21Hotfix = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`[V21][HotfixLoader] Échec chargement ${src}`));
        document.head.appendChild(script);
      });
    }
