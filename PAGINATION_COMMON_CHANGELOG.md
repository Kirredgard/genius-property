# Pagination commune — passe UI

Date : 2026-09-30

## Modifications
- Ajout de `js/core/gp-pagination.js` : composant commun de pagination.
- 12 éléments par page pour les listes concernées.
- Numéros de page cliquables.
- `‹` / `›` fonctionnels.
- Ellipses automatiques pour les longues listes.
- Pagination entièrement masquée lorsqu'il n'y a qu'une seule page.
- Les recherches/filtres remettent la liste à la page 1.

## Pages concernées
- Biens
- Propriétaires
- Locations
- Locataires
- Encaissements
- Dépenses
- Contrats : la route actuelle redirige vers la page Locations ; elle utilise donc la pagination de Locations plutôt qu'un ancien écran Contrats séparé.

## Fichiers modifiés
- `index.html`
- `js/core/gp-pagination.js`
- `js/core/biens-renderer-canonical.js`
- `js/core/locations-page-restorer.js`
- `js/inline/inline-script-11.js`
- `js/pages/compact-layout.js`
- `js/core/current-finance-workflows.js`

Aucun autre fichier fonctionnel n'a été modifié dans cette passe.
