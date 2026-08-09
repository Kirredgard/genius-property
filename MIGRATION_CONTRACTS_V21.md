# Migration Contrats V21

## Statut

Domaine `contracts` créé dans `js/v21/modules/contracts/`.

## Ajouts

- module bootstrap
- service métier contrats
- validation de contrat
- adaptateur Firestore/legacy
- UI liste contrats
- tests Vitest
- façade temporaire `window.GPV21Contracts`

## Rôle métier

Ce module relie :

- locataires
- biens
- paiements
- dashboard

## Prochaine étape recommandée

Migrer le domaine `expenses` / dépenses vers :

`js/v21/modules/expenses/`
