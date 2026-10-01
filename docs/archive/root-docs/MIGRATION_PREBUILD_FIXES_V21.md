# Pré-build fixes V21

## Objectif

Préparer le projet à une vraie exécution locale : healthcheck, typecheck, tests et build.

## Ajouts

- `scripts/v21-healthcheck.mjs`
- script `npm run healthcheck:v21`
- rapport `audit/v21/prebuild-readiness.json`

## Fichiers ajustés

- Aucun import à corriger automatiquement

## Commandes à lancer localement

```bash
npm install
npm run healthcheck:v21
npm run audit:imports
npm run typecheck
npm run test
npm run build
```

## Prochaine étape

Lancer ces commandes dans ton environnement, puis corriger les erreurs réelles remontées par TypeScript/Vite.
