# Firestore Repositories V21

## Objectif

Centraliser les accès Firestore pour éviter que chaque domaine manipule directement Firebase ou les anciens globals.

## Ajouts

- `js/v21/data/firestore.repository.ts`
- `js/v21/data/agency-context.ts`
- tests repository

## Services préparés

- `js/v21/modules/tenants/services/tenants.service.ts`
- `js/v21/modules/properties/services/properties.service.ts`
- `js/v21/modules/contracts/services/contracts.service.ts`

## Statut

La couche repository est prête, mais conserve un fallback local `_pendingSync` si Firestore n’est pas disponible.

## Prochaine étape

Brancher les imports réels du SDK Firebase modulaire :

- `collection`
- `getDocs`
- `addDoc`
- `doc`
- `updateDoc`
- `serverTimestamp`

Puis supprimer les anciens appels legacy domaine par domaine.
