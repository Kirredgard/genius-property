# V20 — Architecture frontend reconstruite progressivement

Base utilisée : `genius-v48-v19-purge-css-js-safe.zip`

## Ce qui est fait dans cette version

### 1. Architecture frontend créée

Nouveaux dossiers :
- `js/core/`
- `js/utils/`
- `js/components/drawers/`
- `js/components/modals/`
- `js/components/tables/`
- `styles/components/`
- `styles/pages/`
- `styles/core/`

### 2. Drawers / modales modularisés

Nouveau module :
- `js/components/drawers/gp-ui-manager.js`

Il centralise :
- fermeture des drawers
- fermeture des modales
- nettoyage des overlays
- nettoyage des classes `body`
- compatibilité avec les anciennes fonctions globales

### 3. Dates centralisées

Nouveau module :
- `js/utils/date-utils.js`

Il prépare le format :
- `jj/mm/aaaa`
- `fr-FR`

### 4. Core app léger

Nouveau module :
- `js/core/app-core-v20.js`

Il sert de point d'entrée propre pour les helpers globaux.

### 5. CSS composants séparé

Nouveau fichier :
- `styles/components/drawers-modals.css`

Il regroupe les règles globales liées aux drawers/modales.

### 6. Code existant relié au nouveau système

Modifié :
- `js/pages/paiements.js`
- `js/pages/biens.js`

Les fermetures appellent maintenant `GPUIManager` quand il est disponible.

## Découpage actuel des fichiers chargés par index.html

### CSS chargés

- `styles/components/drawers-modals.css`
- `https://fonts.googleapis.com`
- `https://fonts.gstatic.com`
- `https://flagcdn.com`
- `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap`
- `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap`
- `styles/theme.css`
- `styles/bundle.optimized.css?v=20260523`
- `styles/mobile.css?v=ultra-mobile-20260522`
- `styles/admin-saas.css?v=saas-v5`
- `styles/license-manager.css?v=license-v7`
- `styles/simple-license-dashboard.css?v=v16`
- `styles/ui-icons-close-enhanced.css?v=20260522-docgold`
- `styles/dashboard.css?v=clean-v1`
- `styles/v30-bureau-theme-pages.css?v=v30`
- `styles/gp-payments-table-compact-v5.css?v=20260523-v5`
- `styles/gp-restore-finance-drawers-v9.css`
- `styles/gp-payments-date-compact-v3.css?v=20260523-v3`

### JS chargés

- `js/components/drawers/gp-ui-manager.js`
- `js/utils/date-utils.js`
- `js/core/app-core-v20.js`
- `js/inline/inline-script-01.js?v=refactor-20260523`
- `js/inline/inline-script-02.module.js?v=refactor-20260523`
- `js/inline/inline-script-03.js?v=refactor-20260523`
- `js/core/lazy-libs.js`
- `js/core/runtime.js`
- `js/core/storage-adapter.js`
- `js/inline/inline-script-04.js?v=refactor-20260523`
- `js/core/firebase-adapter.js?v=firebase-v13-20260519`
- `js/core/db.js`
- `js/core/auth.js`
- `js/core/permissions.js`
- `js/core/license-guard.js?v=license-v8`
- `js/core/super-admin-guard.js?v=v10`
- `js/core/firebase-auth.js`
- `js/core/username-lock.js`
- `js/app.legacy.bundle.js?v=20260522-bien-detail-restored-full-v1`
- `js/safe-bootstrap.js?v=firebase-v7-20260519`
- `js/core/renderers.js`
- `js/core/ui-functions.js`
- `js/core/navigation.js`
- `js/core/validation.js`
- `js/core/forms.js`
- `js/firebase.js?v=firebase-v13-20260519`
- `js/pages/proprietaires.js`
- `js/pages/rapports.js`
- `js/pages/dashboard.js`
- `js/pages/agenda.js`
- `js/pages/messagerie.js`
- `js/pages/sync.js`
- `js/pages/admin-stockage.js`
- `js/pages/admin-saas.js?v=v8`
- `js/pages/license-activation.js?v=v8`
- `js/core/mobile.js`
- `js/pages/mobile-pages.js?v=clean-v1`
- `js/core/legacy-bridge.js`
- `js/pages/dashboard-desktop.js?v=clean`
- `js/core/flicker-fix.js?v=20260524`
- `js/pages/client-subscription.js?v=v19`
- `js/core/simple-role-router.js?v=v19`
- `js/pages/compact-layout.js?v=clean`
- `js/inline/inline-script-05.js?v=refactor-20260523`
- `js/inline/inline-script-06.js?v=refactor-20260523`
- `js/inline/inline-script-07.js?v=refactor-20260523`
- `js/inline/inline-script-08.js?v=refactor-20260523`
- `js/inline/inline-script-09.js?v=refactor-20260523`
- `js/inline/inline-script-10.js?v=refactor-20260523`
- `js/inline/inline-script-11.js?v=refactor-20260523`
- `js/pages/locatives.js`
- `js/pages/depenses.js`
- `js/pages/contrats.js`
- `js/pages/paiements.js`
- `js/pages/locataires.js`
- `js/pages/biens.js?v=20260522-selects-v3`
- `js/core/consolidated-hotfixes.js?v=20260523-consolidated`
- `js/inline/inline-script-12.js?v=refactor-20260523`
- `js/core/doc-actions-ensure.js?v=20260522`
- `js/core/owner-select-edit.js?v=20260523-clean`
- `js/core/dashboard-actions-fix.js?v=20260523-final`
- `js/core/avenir-kpi-fix.js?v=20260523-v48`
- `js/core/paiements-avenir-button-final-fix.js?v=20260523-final`
- `js/core/finance-sidecards-restore.js?v=20260523-sidecards-restore`
- `js/core/finance-pages-sidecards-final.js?v=20260523-final-sidecards`
- `js/core/force-finance-right-column.js?v=20260523-force-right`
- `js/core/gp-date-format-global-v3.js?v=20260523-v3`

## État du bundle legacy

`js/app.legacy.bundle.js` existe encore.

Taille approximative : `582.3 KB`

Il est conservé volontairement, car il contient encore beaucoup de logique métier.
La suppression directe casserait probablement l'application.

## Prochaine étape V21

Migrer page par page le contenu utile de `app.legacy.bundle.js` vers :
- `js/core/`
- `js/utils/`
- `js/components/`
- `js/pages/`

Ordre recommandé :
1. `dashboard`
2. `locataires`
3. `biens`
4. `locatives`
5. `paiements`
6. `depenses`
7. `quittances`
8. `parametres`

Quand toutes les fonctions utiles seront migrées :
- supprimer `<script src="js/app.legacy.bundle.js">`
- supprimer le fichier `js/app.legacy.bundle.js`
