# Payments Migration V21

Premier découpage du domaine paiements hors du legacy.

## Objectifs

- Isoler les calculs financiers testables.
- Centraliser validation, parsing et résumé des paiements.
- Préparer le remplacement de `js/pages/paiements.js` et des hotfixes finance.
- Réduire l'exposition globale à une façade contrôlée.

## Fichiers

- `payments.module.js` : bootstrap du domaine et façade temporaire.
- `services/payments.service.js` : logique métier pure.
- `payments.formatters.js` : parsing, dates, montants.
- `adapters/payments.dom-adapter.js` : lecture/écriture DOM transitoire.
- `ui/payments.layout.js` : rendu résumé V21.

## Compatibilité

Le legacy reste chargé. Les nouvelles fonctions globales suffixées `V21` évitent d'écraser brutalement les anciennes fonctions.
