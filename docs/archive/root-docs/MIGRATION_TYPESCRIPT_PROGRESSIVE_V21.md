# TypeScript progressif V21

## Objectif

Ajouter un contrôle de types sans convertir brutalement tout le projet.

## Ajouts

- `tsconfig.json`
- `js/v21/types/global.d.ts`
- `js/v21/types/domain-types.js`
- script `npm run typecheck`
- CI mise à jour

## Stratégie

La V21 reste en JavaScript, mais TypeScript vérifie progressivement :

- modules V21
- tests V21
- configuration Vite

Le legacy reste exclu pour éviter de bloquer la migration.

## Commandes

```bash
npm install
npm run typecheck
npm run quality
```

## Prochaine étape

Convertir en `.ts` les modules les plus stables :

1. validators
2. adapters
3. services
4. modules bootstrap
