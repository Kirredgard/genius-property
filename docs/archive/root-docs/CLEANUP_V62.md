# V62 — Nettoyage architectural

## Supprimé du runtime
- `v55/` : copie historique complète du projet.
- `index.v22.backup.html` : sauvegarde hors runtime.
- `js/app.legacy.bundle.js` : ancien bundle contenant plusieurs `navigate`, `renderPage` et `openBienDetail`.
- `js/v21/legacy/legacy-loader.js` et `hotfix-loader.js` : loaders non référencés par l’index runtime.
- `js/core/consolidated-hotfixes.js` : ancien agrégat de correctifs et anciens renderers.

## Consolidé
- Le détail Bien est désormais porté uniquement par `js/core/bien-detail-final.js`.
- La navigation `bien-detail` appelle le renderer canonique.
- Les KPI/cartes Bien utilisent uniquement `renderBiensFinal`. `renderBiensCards` reste uniquement un alias de compatibilité vers ce renderer, pas un second système.
- Le reçu PDF par index est maintenant exposé par `encaissements-v2.js`, qui reste la source finance canonique.
- `missing-actions.js` ne contient plus l’ancien renderer/relation finder du détail Bien.

## Conservé volontairement
- `current-workflows.js` : encore utilisé pour les formulaires Bien/Propriétaire et la gestion Location. Il contient plusieurs générations historiques et fera l’objet d’une consolidation séparée, après validation du runtime V62.
- `v32-unified-gp10-edit-forms.js` : garde l’ouverture du formulaire unique en modification pour Locations/Finance.
- `final-navigation-guard.js` et `locative-drawer-router-fix.js` : patches encore actifs ; ils ne sont pas supprimés sans test fonctionnel dédié.

## Règle V62
Aucune nouvelle logique métier Bien/Unité/Location ne doit être ajoutée dans un ancien fichier de hotfix. Toute évolution doit passer par `relations-v52.js`, `biens.js`, `bien-detail-final.js` ou le formulaire Location canonique.
