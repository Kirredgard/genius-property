# Service Permission Guards V21

## Objectif

Ne pas dépendre uniquement du masquage UI. Les actions métier V21 vérifient maintenant les permissions avant d’écrire.

## Ajouts

- `js/v21/permissions/service-permission-guard.ts`
- guards `write`, `admin`, `billing`
- tests guards
- patch des modules métier

## Règle

- création/modification : `write`
- archivage/résiliation : `admin`
- reversements propriétaires : `billing`

## Important

Ces guards frontend complètent les règles Firebase. La vraie sécurité reste côté Firestore/Storage Rules.
