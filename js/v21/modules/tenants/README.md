# Module Tenants V21

Domaine migré : locataires.

## Objectif

Sortir progressivement la logique locataires du legacy bundle et l’isoler dans une architecture claire :

- services
- validateurs
- adaptateurs Firestore
- UI
- façade legacy contrôlée

## API publique temporaire

`window.GPV21Tenants`

- `init()`
- `save(payload)`
- `archive(tenantId)`
- `state()`

Cette façade est temporaire pour permettre une migration progressive sans casser l’existant.
