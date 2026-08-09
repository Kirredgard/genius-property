/**
     * Chargeur legacy contrôlé V21.
     *
     * Par défaut, le legacy est désactivé sur index.v21-clean.html.
     * Pour tester avec compatibilité :
     * - ajouter ?legacy=1 dans l'URL
     * - ou définir window.GPV21_ENABLE_LEGACY = true avant l'import
     */

    export const LEGACY_SCRIPTS = [
  "js/components/drawers/gp-ui-manager.js",
  "js/utils/date-utils.js",
  "js/core/app-core-v20.js",
  "js/inline/inline-script-01.js?v=refactor-20260523",
  "js/inline/inline-script-02.module.js?v=refactor-20260523",
  "js/inline/inline-script-03.js?v=refactor-20260523",
  "js/core/lazy-libs.js",
  "env.js",
  "js/inline/inline-script-02.module.js",
  "js/core/runtime.js",
  "js/core/storage-adapter.js",
  "js/inline/inline-script-04.js?v=refactor-20260523",
  "js/core/db.js",
  "js/core/auth.js",
  "js/core/permissions.js",
  "js/core/license-guard.js?v=license-v8",
  "js/core/super-admin-guard.js?v=v10",
  "js/core/username-lock.js",
  "js/app.legacy.bundle.js?v=20260522-bien-detail-restored-full-v1",
  "js/core/renderers.js",
  "js/core/ui-functions.js",
  "js/core/navigation.js",
  "js/core/validation.js",
  "js/core/forms.js",
  "js/pages/proprietaires.js",
  "js/pages/rapports.js",
  "js/pages/dashboard.js",
  "js/pages/agenda.js",
  "js/pages/messagerie.js",
  "js/pages/sync.js",
  "js/pages/admin-stockage.js",
  "js/pages/admin-saas.js?v=v8",
  "js/pages/license-activation.js?v=v8",
  "js/core/mobile.js",
  "js/pages/mobile-pages.js?v=clean-v1",
  "js/core/legacy-bridge.js",
  "js/pages/dashboard-desktop.js?v=clean",
  "js/core/flicker-fix.js?v=20260524",
  "js/pages/client-subscription.js?v=v19",
  "js/core/simple-role-router.js?v=v19",
  "js/pages/compact-layout.js?v=clean",
  "js/inline/inline-script-05.js?v=refactor-20260523",
  "js/inline/inline-script-06.js?v=refactor-20260523",
  "js/inline/inline-script-07.js?v=refactor-20260523",
  "js/inline/inline-script-08.js?v=refactor-20260523",
  "js/inline/inline-script-09.js?v=refactor-20260523",
  "js/inline/inline-script-10.js?v=refactor-20260523",
  "js/inline/inline-script-11.js?v=refactor-20260523",
  "js/pages/locatives.js",
  "js/pages/depenses.js",
  "js/pages/contrats.js",
  "js/pages/paiements.js",
  "js/pages/locataires.js",
  "js/pages/biens.js?v=20260522-selects-v3",
  "js/core/consolidated-hotfixes.js?v=20260523-consolidated",
  "js/inline/inline-script-12.js?v=refactor-20260523",
  "js/core/doc-actions-ensure.js?v=20260522",
  "js/core/owner-select-edit.js?v=20260523-clean",
  "js/core/dashboard-actions-fix.js?v=20260523-final",
  "js/core/avenir-kpi-fix.js?v=20260523-v48",
  "js/core/paiements-avenir-button-final-fix.js?v=20260523-final",
  "js/core/finance-sidecards-restore.js?v=20260523-sidecards-restore",
  "js/core/finance-pages-sidecards-final.js?v=20260523-final-sidecards",
  "js/core/force-finance-right-column.js?v=20260523-force-right",
  "js/core/gp-date-format-global-v3.js?v=20260523-v3"
];

    export function shouldLoadLegacy() {
      if (typeof window === 'undefined') return false;

      const params = new URLSearchParams(window.location.search);
      return window.GPV21_ENABLE_LEGACY === true || params.get('legacy') === '1';
    }

    export async function loadLegacyScripts(options = {}) {
      const enabled = options.enabled ?? shouldLoadLegacy();

      if (!enabled) {
        console.info('[V21][LegacyLoader] Legacy désactivé.');
        return { loaded: false, count: 0 };
      }

      let loadedCount = 0;

      for (const src of LEGACY_SCRIPTS) {
        await injectScript(src);
        loadedCount += 1;
      }

      console.info(`[V21][LegacyLoader] ${loadedCount} scripts legacy chargés.`);
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
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`[V21][LegacyLoader] Échec chargement ${src}`));
        document.head.appendChild(script);
      });
    }
