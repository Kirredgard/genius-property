import { applyPermissionUI } from './permissions/permission-ui.js';
import './context/user-agency-context.js';
import './rollout/feature-flags.js';
import './rollout/rollout-router.js';
import { initErrorMonitor } from './monitoring/error-monitor.js';
import { setupLinkPreload } from './router/lazy-pages.js';
import './patches/index.js';
import './main.js';
import { loadLegacyScripts } from './legacy/legacy-loader.js';
import { loadHotfixScripts } from './legacy/hotfix-loader.js';

async function bootstrapV21() {
      initErrorMonitor();
  window.GPV21_BOOTSTRAPPED = true;

  try {
    await loadLegacyScripts();
        await loadHotfixScripts();
  } catch (error) {
    console.error('[V21][Bootstrap] Erreur chargement legacy:', error);
  }

  document.dispatchEvent(new CustomEvent('gp:v21-ready', {
    detail: {
      legacyEnabled: window.GPV21_ENABLE_LEGACY === true || new URLSearchParams(location.search).get('legacy') === '1'
    }
  }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapV21, { once: true });
} else {
  bootstrapV21();
}

setupLinkPreload();

if (typeof document !== 'undefined') {
  document.addEventListener('gp:v21-ready', () => applyPermissionUI());
  document.addEventListener('DOMContentLoaded', () => applyPermissionUI(), { once: true });
}
