# TypeScript Strict par domaine V21

## Objectif

Préparer le passage progressif à `strict: true` sans bloquer tout le projet.

## Configs créées

- `tsconfigs/tsconfig.tenants.json`
- `tsconfigs/tsconfig.properties.json`
- `tsconfigs/tsconfig.contracts.json`
- `tsconfigs/tsconfig.notifications.json`
- `tsconfigs/tsconfig.patches.json`
- `tsconfigs/tsconfig.legacy.json`

## Commandes ajoutées

```bash
npm run typecheck:tenants
npm run typecheck:properties
npm run typecheck:contracts
npm run typecheck:notifications
npm run typecheck:strict-domains
```

## Stratégie

Le `tsconfig.json` global reste permissif pour ne pas casser la migration.

Les domaines déjà convertis disposent maintenant d’un fichier strict séparé :

- tenants
- properties
- contracts
- notifications

## Prochaine étape recommandée

Corriger les erreurs strictes domaine par domaine, puis activer `strict: true` globalement quand tous les domaines V21 passent.
