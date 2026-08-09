import { exposeGlobal, getLegacyWindowUsage } from './global-registry.js';

export function installLegacyQuarantine() {
  const report = {
    installedAt: new Date().toISOString(),
    legacyBundleLoaded: typeof globalThis.navigate === 'function' || typeof globalThis.renderTable === 'function',
    exposedGlobals: getLegacyWindowUsage()
  };

  exposeGlobal('GPV21LegacyReport', report, { overwrite: true });
  return report;
}
