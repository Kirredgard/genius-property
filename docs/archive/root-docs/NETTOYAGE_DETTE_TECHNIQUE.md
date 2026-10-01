# Nettoyage dette technique V21

Actions appliquées :

- Suppression de `js/app.legacy.bundle.js` et retrait de son chargement dans `index.html`.
- Consolidation des 6 anciens correctifs `js/core/*fix*.js` dans `js/v21/ui/ui-stability.service.js`.
- Suppression de `js/v21/types/domain-types.js`; la source de vérité devient `js/v21/types/domain-types.ts`.
- Renommage de `styles/bundle.optimized.css` en `styles/app-shell.css`.
- Renommage de `styles/v30-bureau-theme-pages.css` en `styles/bureau-theme-pages.css`.
- Mise à jour de `index.html`, `js/v21/legacy/legacy-loader.js` et `tsconfig.json`.

À valider manuellement : login, dashboard, paiements, dépenses, biens, locataires, contrats, navigation mobile.
