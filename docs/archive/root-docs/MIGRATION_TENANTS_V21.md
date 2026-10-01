# Migration Locataires V21

## Statut

Domaine `tenants` créé dans `js/v21/modules/tenants/`.

## Ce qui a été ajouté

- module bootstrap `tenants.module.js`
- service métier `tenants.service.js`
- validateurs `tenant.validator.js`
- adaptateur Firestore `tenant.firestore.adapter.js`
- rendu UI minimal `tenants.list.js`
- façade temporaire `window.GPV21Tenants`
- tests Vitest

## Pourquoi cette étape

Après Auth et Payments, le domaine locataires est critique parce qu’il relie :

- biens
- contrats
- paiements
- relances
- occupation

## Prochaine étape recommandée

Migrer `properties` / biens immobiliers vers :

`js/v21/modules/properties/`

Puis connecter `tenants.propertyId` au nouveau module biens.
