# Migration Biens Immobiliers V21

## Statut

Domaine `properties` créé dans `js/v21/modules/properties/`.

## Ajouts

- module bootstrap
- service métier biens
- validateurs
- adaptateur Firestore/legacy
- UI liste biens
- tests Vitest
- façade temporaire `window.GPV21Properties`

## Impact

Ce module prépare la connexion propre avec :

- locataires via `propertyId`
- contrats
- paiements
- dashboard statistiques

## Prochaine étape recommandée

Migrer le domaine `contracts` vers :

`js/v21/modules/contracts/`
